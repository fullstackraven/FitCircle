// Server-side proxy for Open Food Facts API to avoid CORS issues
import { Router } from 'express';

const router = Router();

interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'carbohydrates_100g'?: number;
    'proteins_100g'?: number;
    'fat_100g'?: number;
    'fiber_100g'?: number;
    'sugars_100g'?: number;
    'sodium_100g'?: number;
    'saturated-fat_100g'?: number;
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

    const searchParams = new URLSearchParams({
      search_terms: query,
      fields: 'code,product_name,product_name_en,brands,nutriments,serving_size',
      page_size: Math.min(parseInt(limit as string) || 10, 20).toString(),
      sort_by: 'popularity'
    });

    const apiUrl = `https://world.openfoodfacts.org/api/v2/search?${searchParams}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'FitCircle/1.0 (Nutrition Tracker)',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: OpenFoodFactsSearchResponse = await response.json();
    let products = data.products || [];

    // Filter for relevant, English products with nutrition data
    products = products.filter(product => {
      const name = product.product_name || product.product_name_en || '';
      const brand = product.brands || '';
      const searchTerm = query.toLowerCase();
      
      // Must have a name and nutrition data
      if (!name || !product.nutriments || !product.nutriments['energy-kcal_100g']) {
        return false;
      }
      
      // Filter for English text (ASCII characters only)
      if (!/^[\x00-\x7F\s]*$/.test(name)) {
        return false;
      }
      
      // Must match search term in name or brand
      const nameMatch = name.toLowerCase().includes(searchTerm);
      const brandMatch = brand.toLowerCase().includes(searchTerm);
      
      return nameMatch || brandMatch;
    });

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
      
      const nutritionPer100g = {
        calories: nutriments['energy-kcal_100g'] || 0,
        carbs: nutriments['carbohydrates_100g'] || 0,
        protein: nutriments['proteins_100g'] || 0,
        fat: nutriments['fat_100g'] || 0,
        fiber: nutriments['fiber_100g'],
        sugar: nutriments['sugars_100g'],
        sodium: nutriments['sodium_100g'] ? nutriments['sodium_100g'] * 1000 : undefined,
        saturatedFat: nutriments['saturated-fat_100g']
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
    res.status(500).json({ error: 'Failed to search food database' });
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

export default router;