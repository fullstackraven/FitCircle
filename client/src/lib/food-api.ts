// Open Food Facts API integration for food search and barcode lookup
// API Documentation: https://openfoodfacts.github.io/openfoodfacts-server/api/

export interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
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
  product_name_en?: string;
  image_url?: string;
}

export interface OpenFoodFactsResponse {
  status: number;
  product?: OpenFoodFactsProduct;
}

export interface OpenFoodFactsSearchResponse {
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  products: OpenFoodFactsProduct[];
}

class FoodApiService {
  private readonly baseUrl: string;
  
  constructor() {
    // For PWA compatibility, use absolute URLs
    if (typeof window !== 'undefined') {
      this.baseUrl = `${window.location.origin}/api/food`;
    } else {
      this.baseUrl = '/api/food'; // Fallback for server-side
    }
  }
  
  private async makeRequest<T>(url: string): Promise<T> {
    try {
      console.log(`Making food API request to: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`API request failed: ${response.status} ${response.statusText}`);
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Food API response received:', data);
      return data;
    } catch (error) {
      console.error('Food API request failed:', error);
      throw error;
    }
  }
  
  /**
   * Get product information by barcode
   */
  async getProductByBarcode(barcode: string): Promise<OpenFoodFactsProduct | null> {
    const url = `${this.baseUrl}/product/${barcode}`;
    
    try {
      const response = await this.makeRequest<{product?: OpenFoodFactsProduct}>(url);
      return response.product || null;
    } catch (error) {
      console.error(`Failed to fetch product with barcode ${barcode}:`, error);
      return null;
    }
  }
  
  /**
   * Search for products by name
   */
  async searchProducts(query: string, pageSize: number = 10): Promise<any[]> {
    if (!query.trim()) return [];
    
    const searchParams = new URLSearchParams({
      query: query,
      limit: pageSize.toString()
    });
    
    const url = `${this.baseUrl}/search?${searchParams}`;
    
    try {
      const response = await this.makeRequest<{products: any[]}>(url);
      return response.products || [];
    } catch (error) {
      console.error(`Failed to search products for "${query}":`, error);
      return [];
    }
  }
  
  /**
   * Convert backend API product to our FoodEntry format (now handled by backend)
   */
  convertToFoodEntry(product: any, meal: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'breakfast') {
    // Backend now returns converted products, so we just need to update the meal
    return {
      ...product,
      meal,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Legacy method for direct API conversion (kept for barcode scanner)
   */
  convertDirectApiToFoodEntry(product: OpenFoodFactsProduct, meal: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'breakfast') {
    const nutriments = product.nutriments || {};
    
    // Get the best available product name
    const name = product.product_name || product.product_name_en || 'Unknown Product';
    
    // Extract brand (first brand if multiple)
    const brand = product.brands?.split(',')[0]?.trim();
    
    // Extract serving size in grams if available
    const servingSizeMatch = product.serving_size?.match(/(\d+)\s*g/);
    const servingGrams = servingSizeMatch ? parseInt(servingSizeMatch[1]) : undefined;
    
    // Default serving info - prefer API serving size if available
    const quantity = servingGrams || 100;
    const unit = servingGrams ? 'g' : 'g';
    
    // Convert nutrition data from per 100g to actual serving
    const nutritionPer100g = {
      calories: nutriments['energy-kcal_100g'] || 0,
      carbs: nutriments['carbohydrates_100g'] || 0,
      protein: nutriments['proteins_100g'] || 0,
      fat: nutriments['fat_100g'] || 0,
      fiber: nutriments['fiber_100g'],
      sugar: nutriments['sugars_100g'],
      sodium: nutriments['sodium_100g'] ? nutriments['sodium_100g'] * 1000 : undefined, // convert g to mg
      saturatedFat: nutriments['saturated-fat_100g']
    };
    
    // Calculate nutrition for the default serving size
    const multiplier = quantity / 100;
    
    return {
      id: `api-${product.code}-${Date.now()}`,
      name,
      brand,
      barcode: product.code,
      quantity,
      unit: unit as any,
      calories: Math.round(nutritionPer100g.calories * multiplier),
      carbs: Math.round(nutritionPer100g.carbs * multiplier * 10) / 10,
      protein: Math.round(nutritionPer100g.protein * multiplier * 10) / 10,
      fat: Math.round(nutritionPer100g.fat * multiplier * 10) / 10,
      fiber: nutritionPer100g.fiber ? Math.round(nutritionPer100g.fiber * multiplier * 10) / 10 : undefined,
      sugar: nutritionPer100g.sugar ? Math.round(nutritionPer100g.sugar * multiplier * 10) / 10 : undefined,
      sodium: nutritionPer100g.sodium ? Math.round(nutritionPer100g.sodium * multiplier) : undefined,
      saturatedFat: nutritionPer100g.saturatedFat ? Math.round(nutritionPer100g.saturatedFat * multiplier * 10) / 10 : undefined,
      nutritionPer100g,
      meal,
      timestamp: new Date().toISOString()
    };
  }
}

export const foodApiService = new FoodApiService();