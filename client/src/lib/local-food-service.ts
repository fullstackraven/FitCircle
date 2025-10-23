import comprehensiveFoods from '../data/comprehensive-foods.json';

// Types for our local food service
export type FoodUnit = 'g' | 'oz' | 'cup' | 'piece' | 'serving';

export interface FoodEntry {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  quantity: number;
  unit: FoodUnit;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  potassium?: number;
  cholesterol?: number;
  vitaminA?: number;
  vitaminC?: number;
  calcium?: number;
  iron?: number;
  servings?: number; // Number of servings multiplier (defaults to 1)
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: string;
  nutritionPer100g?: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    saturatedFat?: number;
  };
}
export interface LocalFoodItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  quantity: number;
  unit: FoodUnit;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  potassium?: number;
  cholesterol?: number;
  vitaminA?: number;
  vitaminC?: number;
  calcium?: number;
  iron?: number;
  nutritionPer100g?: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    saturatedFat?: number;
  };
}

export interface CustomFoodInput {
  name: string;
  brand?: string;
  quantity: number;
  unit: FoodUnit;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  potassium?: number;
  cholesterol?: number;
  vitaminA?: number;
  vitaminC?: number;
  calcium?: number;
  iron?: number;
}

export interface AddCustomFoodResponse {
  success: boolean;
  food?: LocalFoodItem;
  message?: string;
  error?: string;
}

// IndexedDB helper for custom foods
class CustomFoodStore {
  private dbName = 'FitCircleCustomFoods';
  private storeName = 'foods';
  private version = 1;

  async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('barcode', 'barcode', { unique: false });
        }
      };
    });
  }

  async addFood(food: LocalFoodItem): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    await store.add(food);
  }

  async updateFood(food: LocalFoodItem): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    await store.put(food);
  }

  async deleteFood(id: string): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    await store.delete(id);
  }

  async getAllFoods(): Promise<LocalFoodItem[]> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
      });
    } catch (error) {
      console.error('Error getting custom foods from IndexedDB:', error);
      return [];
    }
  }

  async getFoodByBarcode(barcode: string): Promise<LocalFoodItem | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('barcode');
      
      return new Promise((resolve, reject) => {
        const request = index.get(barcode);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
      });
    } catch (error) {
      console.error('Error getting food by barcode from IndexedDB:', error);
      return null;
    }
  }
}

// Local Food Service class
export class LocalFoodService {
  private customFoodStore: CustomFoodStore;
  private localFoods: LocalFoodItem[];
  private searchIndex: Map<string, LocalFoodItem[]>;

  constructor() {
    this.customFoodStore = new CustomFoodStore();
    this.localFoods = comprehensiveFoods as LocalFoodItem[];
    this.searchIndex = new Map();
    this.buildSearchIndex();
  }

  // Build a search index for faster lookups
  private buildSearchIndex(): void {
    console.log(`Building search index for ${this.localFoods.length} foods...`);
    
    this.localFoods.forEach(food => {
      const searchKey = this.getSearchKey(food);
      const words = searchKey.split(' ');
      
      words.forEach(word => {
        if (word.length >= 2) {
          if (!this.searchIndex.has(word)) {
            this.searchIndex.set(word, []);
          }
          this.searchIndex.get(word)!.push(food);
        }
      });
    });
    
    console.log(`Search index built with ${this.searchIndex.size} entries`);
  }

  private getSearchKey(food: LocalFoodItem): string {
    const name = food.name || '';
    const brand = food.brand || '';
    return `${name} ${brand}`.toLowerCase().trim();
  }

  // Search products with local data only
  async searchProducts(query: string, limit: number = 20): Promise<LocalFoodItem[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      // Get custom foods from IndexedDB
      const customFoods = await this.customFoodStore.getAllFoods();
      const allFoods = [...this.localFoods, ...customFoods];

      const normalizedQuery = query.toLowerCase().trim();
      const queryWords = normalizedQuery.split(' ').filter(word => word.length >= 2);
      
      // Score-based search
      const searchResults: { food: LocalFoodItem; score: number }[] = [];

      allFoods.forEach(food => {
        const searchKey = this.getSearchKey(food);
        const name = food.name.toLowerCase();
        const brand = (food.brand || '').toLowerCase();
        
        let score = 0;

        // Exact name match (highest score)
        if (name === normalizedQuery) {
          score += 100;
        }
        // Name starts with query
        else if (name.startsWith(normalizedQuery)) {
          score += 50;
        }
        // Name contains query
        else if (name.includes(normalizedQuery)) {
          score += 30;
        }

        // Brand matching
        if (brand && brand.includes(normalizedQuery)) {
          score += 20;
        }

        // Word-based matching
        queryWords.forEach(word => {
          if (searchKey.includes(word)) {
            score += 10;
          }
        });

        if (score > 0) {
          searchResults.push({ food, score });
        }
      });

      // Sort by score and return top results
      const sortedResults = searchResults
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(result => result.food);

      console.log(`Local search for "${query}": Found ${sortedResults.length} results`);
      return sortedResults;

    } catch (error) {
      console.error('Error searching local foods:', error);
      return [];
    }
  }

  // Get product by barcode from local data
  async getProductByBarcode(barcode: string): Promise<LocalFoodItem | null> {
    try {
      // Check custom foods first
      const customFood = await this.customFoodStore.getFoodByBarcode(barcode);
      if (customFood) {
        return customFood;
      }

      // Check comprehensive foods
      const localFood = this.localFoods.find(food => food.barcode === barcode);
      return localFood || null;

    } catch (error) {
      console.error('Error getting product by barcode:', error);
      return null;
    }
  }

  // Add custom food to IndexedDB
  async addCustomFood(input: CustomFoodInput): Promise<AddCustomFoodResponse> {
    try {
      // Validate required fields (allow 0 values, only reject undefined/NaN)
      if (!input.name?.trim() || 
          input.calories === undefined || Number.isNaN(input.calories) ||
          input.carbs === undefined || Number.isNaN(input.carbs) ||
          input.protein === undefined || Number.isNaN(input.protein) ||
          input.fat === undefined || Number.isNaN(input.fat)) {
        return {
          success: false,
          error: 'Missing required fields: name, calories, carbs, protein, and fat are required.'
        };
      }

      // Create the food item
      const customFood: LocalFoodItem = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: input.name.trim(),
        brand: input.brand?.trim() || undefined,
        quantity: input.quantity || 100,
        unit: input.unit || 'g',
        calories: input.calories,
        carbs: input.carbs,
        protein: input.protein,
        fat: input.fat,
        fiber: input.fiber,
        sugar: input.sugar,
        sodium: input.sodium,
        saturatedFat: input.saturatedFat,
        potassium: input.potassium,
        cholesterol: input.cholesterol,
        vitaminA: input.vitaminA,
        vitaminC: input.vitaminC,
        calcium: input.calcium,
        iron: input.iron
      };

      // Calculate nutrition per 100g for consistency
      if (input.quantity !== 100) {
        const multiplier = 100 / input.quantity;
        customFood.nutritionPer100g = {
          calories: customFood.calories * multiplier,
          carbs: customFood.carbs * multiplier,
          protein: customFood.protein * multiplier,
          fat: customFood.fat * multiplier,
          fiber: customFood.fiber !== undefined ? customFood.fiber * multiplier : undefined,
          sugar: customFood.sugar !== undefined ? customFood.sugar * multiplier : undefined,
          sodium: customFood.sodium !== undefined ? customFood.sodium * multiplier : undefined,
          saturatedFat: customFood.saturatedFat !== undefined ? customFood.saturatedFat * multiplier : undefined
        };
      }

      // Save to IndexedDB
      await this.customFoodStore.addFood(customFood);

      console.log('Custom food added successfully:', customFood.name);
      return {
        success: true,
        food: customFood,
        message: `"${customFood.name}" has been added to your custom foods.`
      };

    } catch (error) {
      console.error('Error adding custom food:', error);
      return {
        success: false,
        error: 'Failed to save custom food. Please try again.'
      };
    }
  }

  // Convert LocalFoodItem to FoodEntry format
  convertToFoodEntry(food: LocalFoodItem, meal: 'breakfast' | 'lunch' | 'dinner' | 'snack'): FoodEntry {
    return {
      id: food.id,
      name: food.name,
      brand: food.brand,
      barcode: food.barcode,
      quantity: food.quantity,
      unit: food.unit,
      calories: food.calories,
      carbs: food.carbs,
      protein: food.protein,
      fat: food.fat,
      fiber: food.fiber,
      sugar: food.sugar,
      sodium: food.sodium,
      saturatedFat: food.saturatedFat,
      potassium: food.potassium,
      cholesterol: food.cholesterol,
      vitaminA: food.vitaminA,
      vitaminC: food.vitaminC,
      calcium: food.calcium,
      iron: food.iron,
      meal,
      timestamp: new Date().toISOString(),
      nutritionPer100g: food.nutritionPer100g
    };
  }

  // Update custom food
  async updateCustomFood(id: string, input: Partial<CustomFoodInput>): Promise<AddCustomFoodResponse> {
    try {
      const customFoods = await this.customFoodStore.getAllFoods();
      const existingFood = customFoods.find(food => food.id === id);
      
      if (!existingFood) {
        return {
          success: false,
          error: 'Custom food not found.'
        };
      }

      const updatedFood: LocalFoodItem = {
        ...existingFood,
        ...input,
        id: existingFood.id // Ensure ID doesn't change
      };

      await this.customFoodStore.updateFood(updatedFood);

      return {
        success: true,
        food: updatedFood,
        message: `"${updatedFood.name}" has been updated.`
      };

    } catch (error) {
      console.error('Error updating custom food:', error);
      return {
        success: false,
        error: 'Failed to update custom food. Please try again.'
      };
    }
  }

  // Delete custom food
  async deleteCustomFood(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.customFoodStore.deleteFood(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting custom food:', error);
      return {
        success: false,
        error: 'Failed to delete custom food. Please try again.'
      };
    }
  }

  // Get all custom foods
  async getCustomFoods(): Promise<LocalFoodItem[]> {
    return await this.customFoodStore.getAllFoods();
  }

  // Clear all custom foods
  async clearAllCustomFoods(): Promise<{ success: boolean; error?: string }> {
    try {
      const customFoods = await this.customFoodStore.getAllFoods();
      for (const food of customFoods) {
        await this.customFoodStore.deleteFood(food.id);
      }
      return { success: true };
    } catch (error) {
      console.error('Error clearing custom foods:', error);
      return {
        success: false,
        error: 'Failed to clear custom foods. Please try again.'
      };
    }
  }

  // Get all foods (local database + custom foods)
  async getAllFoods(): Promise<LocalFoodItem[]> {
    const customFoods = await this.customFoodStore.getAllFoods();
    return [...this.localFoods, ...customFoods];
  }
}

// Create and export a singleton instance
export const localFoodService = new LocalFoodService();