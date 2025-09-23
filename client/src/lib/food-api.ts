// Open Food Facts API integration for food search and barcode lookup
// API Documentation: https://openfoodfacts.github.io/openfoodfacts-server/api/

import commonFoodsData from '@/data/common-foods.json';

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
      const origin = window.location.origin;
      const hostname = window.location.hostname;
      
      console.log('Food API - Current origin:', origin);
      console.log('Food API - Current hostname:', hostname);
      
      // Handle different deployment scenarios
      if (hostname.includes('.replit.app')) {
        // PWA on static hosting - need to call the dev server API
        const devHostname = hostname.replace('.replit.app', '.replit.dev');
        this.baseUrl = `https://${devHostname}/api/food`;
        console.log('Food API - PWA detected, using dev server API');
      } else if (hostname.includes('.replit.dev')) {
        // Preview or dev environment - same origin
        this.baseUrl = `${origin}/api/food`;
      } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Local development
        this.baseUrl = `${origin}/api/food`;
      } else {
        // Other deployment - try current origin first
        this.baseUrl = `${origin}/api/food`;
      }
      
      console.log('Food API - Using base URL:', this.baseUrl);
    } else {
      this.baseUrl = '/api/food'; // Fallback for server-side
    }
  }
  
  private async makeRequest<T>(url: string, retryWithRelative = true): Promise<T> {
    try {
      console.log(`Making food API request to: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`API request failed: ${response.status} ${response.statusText}`);
        throw new Error(`API request failed: ${response.status}`);
      }
      
      // Defensive check: ensure we got JSON, not HTML (PWA service worker issue)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API returned non-JSON response:', contentType);
        throw new Error(`Expected JSON response, got: ${contentType}`);
      }
      
      const data = await response.json();
      console.log('Food API response received:', data);
      return data;
    } catch (error) {
      console.error('Food API request failed:', error);
      
      // If absolute URL fails and we haven't tried relative yet, try relative URL as fallback
      if (retryWithRelative && url.startsWith('http') && typeof window !== 'undefined') {
        console.log('Retrying with relative URL as fallback...');
        const relativePath = url.split('/api/food')[1] || '';
        const relativeUrl = `/api/food${relativePath}`;
        return this.makeRequest<T>(relativeUrl, false);
      }
      
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
   * Search for products by name - uses local database first, then API fallback
   */
  async searchProducts(query: string, pageSize: number = 10): Promise<any[]> {
    if (!query.trim()) return [];
    
    const searchLower = query.toLowerCase();
    
    // First, search local database
    const localResults = commonFoodsData.filter(food => 
      food.name.toLowerCase().includes(searchLower) ||
      (food.brand && food.brand.toLowerCase().includes(searchLower))
    ).slice(0, Math.min(pageSize, 8));
    
    console.log(`Local search for "${query}" returned ${localResults.length} results`);
    
    // If we have enough local results, return them
    if (localResults.length >= 3) {
      return localResults;
    }
    
    // If not enough local results, try API as fallback
    try {
      console.log(`Searching API for additional results for "${query}"`);
      const searchParams = new URLSearchParams({
        query: query,
        limit: (pageSize - localResults.length).toString()
      });
      
      const url = `${this.baseUrl}/search?${searchParams}`;
      const response = await this.makeRequest<{products: any[]}>(url);
      const apiResults = response.products || [];
      
      console.log(`API search returned ${apiResults.length} additional results`);
      
      // Combine local and API results, prioritizing local
      return [...localResults, ...apiResults].slice(0, pageSize);
    } catch (error) {
      console.error(`API search failed, using only local results:`, error);
      return localResults;
    }
  }
  
  /**
   * Convert product to our FoodEntry format (handles both local and API products)
   */
  convertToFoodEntry(product: any, meal: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'breakfast') {
    // For local products (already in our format) or backend-converted products
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

// Helper function to get local foods for quick access
export const getLocalFoods = () => commonFoodsData;

// Helper function to search local foods only
export const searchLocalFoods = (query: string, limit: number = 10) => {
  if (!query.trim()) return [];
  
  const searchLower = query.toLowerCase();
  return commonFoodsData.filter(food => 
    food.name.toLowerCase().includes(searchLower) ||
    (food.brand && food.brand.toLowerCase().includes(searchLower))
  ).slice(0, limit);
};