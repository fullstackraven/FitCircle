// Server-side proxy for Open Food Facts API to avoid CORS issues
import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'energy_100g'?: number;
    'carbohydrates_100g'?: number;
    'proteins_100g'?: number;
    'fat_100g'?: number;
    'fiber_100g'?: number;
    'sugars_100g'?: number;
    'sodium_100g'?: number;
    'salt_100g'?: number;
    'saturated-fat_100g'?: number;
    [key: string]: any; // Allow additional nutrition fields
  };
  serving_size?: string;
}

interface OpenFoodFactsSearchResponse {
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  products: OpenFoodFactsProduct[];
}

// Search food products
router.get('/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.json({ products: [] });
    }

    // Use v1 API which supports full-text search (v2 doesn't)
    const searchParams = new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      fields: 'code,product_name,product_name_en,brands,nutriments,serving_size',
      page_size: Math.min(parseInt(limit as string) || 10, 20).toString()
    });

    const apiUrl = `https://world.openfoodfacts.org/cgi/search.pl?${searchParams}`;
    
    console.log(`Making API request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'FitCircle/1.0 (Nutrition Tracker)',
      },
    });

    if (!response.ok) {
      console.error(`API request failed: ${response.status}`);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: OpenFoodFactsSearchResponse = await response.json();
    console.log(`API returned ${data.products?.length || 0} total products`);
    let products = data.products || [];
    
    // Log API results for debugging
    console.log('Products from Open Food Facts:', products.slice(0, 3).map(p => ({
      name: p.product_name || p.product_name_en || 'No name',
      brand: p.brands || 'No brand'
    })));

    // The Open Food Facts API does ingredient-based search, not just name matching
    // So "egg" returns products that contain eggs (like brioche, mayonnaise)
    // Let's be more permissive and trust the API's search relevance
    products = products.filter(product => {
      const name = product.product_name || product.product_name_en || '';
      
      // Just require a valid name - trust the API's search algorithm
      if (!name || name.trim().length === 0) {
        return false;
      }
      
      // Accept all products with names since the API already filtered by relevance
      return true;
    });
    
    console.log(`Using API search results (ingredient-based): ${products.length} products`);
    
    console.log(`Search for "${query}": Found ${products.length} matching products out of ${data.products?.length || 0} total`);
    
    // Log sample products that passed filtering
    if (products.length > 0) {
      console.log('Filtered products:', products.slice(0, 2).map(p => ({
        name: p.product_name || p.product_name_en,
        brand: p.brands,
        hasNutriments: !!p.nutriments,
        calories: p.nutriments?.['energy-kcal_100g']
      })));
    }

    // Convert to our format
    const convertedProducts = products.map(product => {
      const nutriments = product.nutriments || {};
      const name = product.product_name_en || product.product_name || 'Unknown Product';
      const brand = product.brands?.split(',')[0]?.trim();
      
      // Extract serving size in grams if available
      const servingSizeMatch = product.serving_size?.match(/(\d+)\s*g/);
      const servingGrams = servingSizeMatch ? parseInt(servingSizeMatch[1]) : undefined;
      
      const quantity = servingGrams || 100;
      const unit = servingGrams ? 'g' : 'g';
      
      // Handle missing nutriments gracefully
      const nutritionPer100g = {
        calories: (nutriments?.['energy-kcal_100g'] || nutriments?.['energy_100g'] || 0),
        carbs: nutriments?.['carbohydrates_100g'] || 0,
        protein: nutriments?.['proteins_100g'] || 0,
        fat: nutriments?.['fat_100g'] || 0,
        fiber: nutriments?.['fiber_100g'] || undefined,
        sugar: nutriments?.['sugars_100g'] || undefined,
        sodium: nutriments?.['sodium_100g'] ? nutriments['sodium_100g'] * 1000 : (nutriments?.['salt_100g'] ? nutriments['salt_100g'] * 400 : undefined),
        saturatedFat: nutriments?.['saturated-fat_100g'] || undefined
      };
      
      const multiplier = quantity / 100;
      
      return {
        id: `api-${product.code}-${Date.now()}`,
        name: name.trim(),
        brand,
        barcode: product.code,
        quantity,
        unit,
        calories: Math.round(nutritionPer100g.calories * multiplier),
        carbs: Math.round(nutritionPer100g.carbs * multiplier * 10) / 10,
        protein: Math.round(nutritionPer100g.protein * multiplier * 10) / 10,
        fat: Math.round(nutritionPer100g.fat * multiplier * 10) / 10,
        fiber: nutritionPer100g.fiber ? Math.round(nutritionPer100g.fiber * multiplier * 10) / 10 : undefined,
        sugar: nutritionPer100g.sugar ? Math.round(nutritionPer100g.sugar * multiplier * 10) / 10 : undefined,
        sodium: nutritionPer100g.sodium ? Math.round(nutritionPer100g.sodium * multiplier) : undefined,
        saturatedFat: nutritionPer100g.saturatedFat ? Math.round(nutritionPer100g.saturatedFat * multiplier * 10) / 10 : undefined,
        nutritionPer100g
      };
    });

    res.json({ products: convertedProducts });
  } catch (error) {
    console.error('Food API proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    res.status(500).json({ error: 'Failed to search food database', details: errorMessage });
  }
});

// Get product by barcode
router.get('/product/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    
    const apiUrl = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=code,product_name,product_name_en,brands,nutriments,serving_size`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'FitCircle/1.0 (Nutrition Tracker)',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 1 && data.product) {
      res.json({ product: data.product });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Food API proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Add custom food to database
router.post('/add-custom', async (req, res) => {
  try {
    const {
      name,
      brand = '',
      quantity = 100,
      unit = 'g',
      calories,
      carbs,
      protein,
      fat,
      fiber,
      sugar,
      sodium,
      saturatedFat,
      potassium,
      cholesterol,
      vitaminA,
      vitaminC,
      calcium,
      iron
    } = req.body;

    // Validate required fields
    if (!name || !calories || carbs === undefined || protein === undefined || fat === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields. Name, calories, carbs, protein, and fat are required.' 
      });
    }

    // Create new food entry
    const newFood = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      brand: brand.trim(),
      barcode: '',
      quantity: parseFloat(quantity) || 100,
      unit: unit || 'g',
      calories: Math.round(parseFloat(calories)),
      carbs: Math.round(parseFloat(carbs) * 10) / 10,
      protein: Math.round(parseFloat(protein) * 10) / 10,
      fat: Math.round(parseFloat(fat) * 10) / 10,
      fiber: fiber !== undefined ? Math.round(parseFloat(fiber) * 10) / 10 : undefined,
      sugar: sugar !== undefined ? Math.round(parseFloat(sugar) * 10) / 10 : undefined,
      sodium: sodium !== undefined ? Math.round(parseFloat(sodium)) : undefined,
      saturatedFat: saturatedFat !== undefined ? Math.round(parseFloat(saturatedFat) * 10) / 10 : undefined,
      // Add micronutrients
      potassium: potassium !== undefined ? Math.round(parseFloat(potassium)) : undefined,
      cholesterol: cholesterol !== undefined ? Math.round(parseFloat(cholesterol)) : undefined,
      vitaminA: vitaminA !== undefined ? Math.round(parseFloat(vitaminA)) : undefined,
      vitaminC: vitaminC !== undefined ? Math.round(parseFloat(vitaminC)) : undefined,
      calcium: calcium !== undefined ? Math.round(parseFloat(calcium)) : undefined,
      iron: iron !== undefined ? Math.round(parseFloat(iron) * 10) / 10 : undefined,
      nutritionPer100g: {
        calories: Math.round(parseFloat(calories) * (100 / (parseFloat(quantity) || 100))),
        carbs: Math.round(parseFloat(carbs) * (100 / (parseFloat(quantity) || 100)) * 10) / 10,
        protein: Math.round(parseFloat(protein) * (100 / (parseFloat(quantity) || 100)) * 10) / 10,
        fat: Math.round(parseFloat(fat) * (100 / (parseFloat(quantity) || 100)) * 10) / 10,
        fiber: fiber !== undefined ? Math.round(parseFloat(fiber) * (100 / (parseFloat(quantity) || 100)) * 10) / 10 : 0,
        sugar: sugar !== undefined ? Math.round(parseFloat(sugar) * (100 / (parseFloat(quantity) || 100)) * 10) / 10 : 0,
        sodium: sodium !== undefined ? Math.round(parseFloat(sodium) * (100 / (parseFloat(quantity) || 100))) : 0,
        saturatedFat: saturatedFat !== undefined ? Math.round(parseFloat(saturatedFat) * (100 / (parseFloat(quantity) || 100)) * 10) / 10 : 0
      }
    };

    // Read current database
    const dbPath = path.join(process.cwd(), 'client', 'src', 'data', 'comprehensive-foods.json');
    let foods = [];
    
    try {
      const data = fs.readFileSync(dbPath, 'utf8');
      foods = JSON.parse(data);
    } catch (error) {
      console.error('Error reading food database:', error);
      return res.status(500).json({ error: 'Failed to read food database' });
    }

    // Add new food to database
    foods.push(newFood);

    // Write back to file
    try {
      fs.writeFileSync(dbPath, JSON.stringify(foods, null, 2));
      console.log(`Added custom food: ${newFood.name} (${newFood.brand || 'No brand'}) to database`);
    } catch (error) {
      console.error('Error writing food database:', error);
      return res.status(500).json({ error: 'Failed to save food to database' });
    }

    res.json({ 
      success: true, 
      food: newFood,
      message: `${newFood.name} has been added to your food database!`
    });
  } catch (error) {
    console.error('Add custom food error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to add custom food', details: errorMessage });
  }
});

export default router;