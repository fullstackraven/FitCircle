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

// IndexedDB helper for migration only
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
}

// Local Food Service class
export class LocalFoodService {
  private searchIndex: Map<string, LocalFoodItem[]>;
  private readonly FOOD_DATABASE_KEY = 'fitcircle_food_database';
  private readonly MIGRATION_FLAG_KEY = 'fitcircle_food_database_migrated';

  constructor() {
    this.searchIndex = new Map();
    this.migrateToLocalStorage();
  }

  // Migrate from JSON and IndexedDB to localStorage (one-time operation)
  private async migrateToLocalStorage(): Promise<void> {
    try {
      const migrated = localStorage.getItem(this.MIGRATION_FLAG_KEY);
      
      if (!migrated) {
        console.log('First load: Migrating food database to localStorage...');
        
        // Get custom foods from IndexedDB
        const customFoodStore = new CustomFoodStore();
        const customFoods = await customFoodStore.getAllFoods();
        console.log(`Found ${customFoods.length} custom foods in IndexedDB`);
        
        // Get built-in foods from JSON
        const builtInFoods = comprehensiveFoods as LocalFoodItem[];
        console.log(`Found ${builtInFoods.length} built-in foods from JSON`);
        
        // Load previously deleted built-in food IDs
        const deletedIds = this.loadLegacyDeletedFoodIds();
        
        // Filter out deleted built-in foods
        const activeBuiltInFoods = builtInFoods.filter(food => !deletedIds.has(food.id));
        console.log(`Keeping ${activeBuiltInFoods.length} built-in foods (${deletedIds.size} were deleted)`);
        
        // Combine all foods
        const allFoods = [...activeBuiltInFoods, ...customFoods];
        
        // Save to localStorage
        localStorage.setItem(this.FOOD_DATABASE_KEY, JSON.stringify(allFoods));
        localStorage.setItem(this.MIGRATION_FLAG_KEY, 'true');
        
        console.log(`✅ Migration complete: ${allFoods.length} foods saved to localStorage`);
        
        // Clean up legacy deleted food IDs
        localStorage.removeItem('fitcircle_deleted_builtin_foods');
      }
      
      // Build search index
      this.buildSearchIndex();
    } catch (error) {
      console.error('Error during migration:', error);
    }
  }

  // Load legacy deleted food IDs from old system
  private loadLegacyDeletedFoodIds(): Set<string> {
    try {
      const stored = localStorage.getItem('fitcircle_deleted_builtin_foods');
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading legacy deleted food IDs:', error);
    }
    return new Set();
  }

  // Get all foods from localStorage
  private getFoodsFromStorage(): LocalFoodItem[] {
    try {
      const stored = localStorage.getItem(this.FOOD_DATABASE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading foods from localStorage:', error);
    }
    return [];
  }

  // Save all foods to localStorage
  private saveFoodsToStorage(foods: LocalFoodItem[]): void {
    try {
      localStorage.setItem(this.FOOD_DATABASE_KEY, JSON.stringify(foods));
    } catch (error) {
      console.error('Error saving foods to localStorage:', error);
    }
  }

  // Build a search index for faster lookups
  private buildSearchIndex(): void {
    const foods = this.getFoodsFromStorage();
    console.log(`Building search index for ${foods.length} foods...`);
    
    this.searchIndex.clear();
    
    foods.forEach(food => {
      const searchKey = this.getSearchKey(food);
      const words = searchKey.split(' ');
      
      words.forEach(word => {
        if (word.length >= 1) {
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
    if (!query || query.trim().length < 1) {
      return [];
    }

    try {
      const allFoods = this.getFoodsFromStorage();
      const normalizedQuery = query.toLowerCase().trim();
      const queryWords = normalizedQuery.split(' ').filter(word => word.length >= 1);
      
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
      const foods = this.getFoodsFromStorage();
      const food = foods.find(f => f.barcode === barcode);
      return food || null;
    } catch (error) {
      console.error('Error getting product by barcode:', error);
      return null;
    }
  }

  // Add custom food (now stored in localStorage)
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

      // Add to localStorage
      const foods = this.getFoodsFromStorage();
      foods.push(customFood);
      this.saveFoodsToStorage(foods);
      this.buildSearchIndex();

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

  // Update food (works for both built-in and custom foods)
  async updateFood(id: string, input: Partial<CustomFoodInput>): Promise<AddCustomFoodResponse> {
    try {
      const foods = this.getFoodsFromStorage();
      const foodIndex = foods.findIndex(food => food.id === id);
      
      if (foodIndex === -1) {
        return {
          success: false,
          error: 'Food not found.'
        };
      }

      const existingFood = foods[foodIndex];
      const updatedFood: LocalFoodItem = {
        ...existingFood,
        ...input,
        id: existingFood.id // Ensure ID doesn't change
      };

      // Recalculate nutrition per 100g if quantity changed
      if (input.quantity && input.quantity !== 100) {
        const multiplier = 100 / input.quantity;
        updatedFood.nutritionPer100g = {
          calories: updatedFood.calories * multiplier,
          carbs: updatedFood.carbs * multiplier,
          protein: updatedFood.protein * multiplier,
          fat: updatedFood.fat * multiplier,
          fiber: updatedFood.fiber !== undefined ? updatedFood.fiber * multiplier : undefined,
          sugar: updatedFood.sugar !== undefined ? updatedFood.sugar * multiplier : undefined,
          sodium: updatedFood.sodium !== undefined ? updatedFood.sodium * multiplier : undefined,
          saturatedFat: updatedFood.saturatedFat !== undefined ? updatedFood.saturatedFat * multiplier : undefined
        };
      }

      foods[foodIndex] = updatedFood;
      this.saveFoodsToStorage(foods);
      this.buildSearchIndex();

      return {
        success: true,
        food: updatedFood,
        message: `"${updatedFood.name}" has been updated.`
      };

    } catch (error) {
      console.error('Error updating food:', error);
      return {
        success: false,
        error: 'Failed to update food. Please try again.'
      };
    }
  }

  // Delete food (works for both built-in and custom foods)
  async deleteFood(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const foods = this.getFoodsFromStorage();
      const filteredFoods = foods.filter(food => food.id !== id);
      
      if (filteredFoods.length === foods.length) {
        return {
          success: false,
          error: 'Food not found.'
        };
      }

      this.saveFoodsToStorage(filteredFoods);
      this.buildSearchIndex();
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting food:', error);
      return {
        success: false,
        error: 'Failed to delete food. Please try again.'
      };
    }
  }

  // Legacy method for compatibility - now just calls deleteFood
  deleteBuiltInFood(id: string): { success: boolean; error?: string } {
    const foods = this.getFoodsFromStorage();
    const filteredFoods = foods.filter(food => food.id !== id);
    
    if (filteredFoods.length === foods.length) {
      return {
        success: false,
        error: 'Food not found.'
      };
    }

    this.saveFoodsToStorage(filteredFoods);
    this.buildSearchIndex();
    
    return { success: true };
  }

  // Legacy method for compatibility - now just calls deleteFood
  async deleteCustomFood(id: string): Promise<{ success: boolean; error?: string }> {
    return this.deleteFood(id);
  }

  // Legacy method for compatibility
  async updateCustomFood(id: string, input: Partial<CustomFoodInput>): Promise<AddCustomFoodResponse> {
    return this.updateFood(id, input);
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

  // Get all custom foods
  async getCustomFoods(): Promise<LocalFoodItem[]> {
    const foods = this.getFoodsFromStorage();
    return foods.filter(food => food.id.startsWith('custom-'));
  }

  // Clear all custom foods
  async clearAllCustomFoods(): Promise<{ success: boolean; error?: string }> {
    try {
      const foods = this.getFoodsFromStorage();
      const nonCustomFoods = foods.filter(food => !food.id.startsWith('custom-'));
      this.saveFoodsToStorage(nonCustomFoods);
      this.buildSearchIndex();
      return { success: true };
    } catch (error) {
      console.error('Error clearing custom foods:', error);
      return {
        success: false,
        error: 'Failed to clear custom foods. Please try again.'
      };
    }
  }

  // Get all foods from localStorage
  async getAllFoods(): Promise<LocalFoodItem[]> {
    return this.getFoodsFromStorage();
  }

  // Get food database for backup
  getFoodDatabaseForBackup(): LocalFoodItem[] {
    return this.getFoodsFromStorage();
  }

  // Restore food database from backup
  restoreFoodDatabase(foods: LocalFoodItem[]): { success: boolean; error?: string } {
    try {
      this.saveFoodsToStorage(foods);
      this.buildSearchIndex();
      return { success: true };
    } catch (error) {
      console.error('Error restoring food database:', error);
      return {
        success: false,
        error: 'Failed to restore food database. Please try again.'
      };
    }
  }
}

// Create and export a singleton instance
export const localFoodService = new LocalFoodService();
