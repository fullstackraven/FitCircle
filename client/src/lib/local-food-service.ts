import { per100gForFood,nutrientFields } from './nutrition';
import { barcodeIdentity } from './barcode';
import { readIndexedFoods, foodDataSchema } from './backup';
import comprehensiveFoods from '../data/comprehensive-foods.json';

// Types for our local food service
export type FoodUnit = 'g' | 'oz' | 'cup' | 'piece' | 'serving' | 'ml' | 'slice';

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

// Local Food Service class
export class LocalFoodService {
  private readonly FOOD_DATABASE_KEY = 'fitcircle_food_database';
  private readonly MIGRATION_FLAG_KEY = 'fitcircle_food_database_migrated';

  readonly ready: Promise<void>;

  constructor() {
    this.ready = this.migrateToLocalStorage();
  }

  // Migrate from JSON and IndexedDB to localStorage (one-time operation)
  private async migrateToLocalStorage(): Promise<void> {
    try {
      const migrated = localStorage.getItem(this.MIGRATION_FLAG_KEY);
      
      if (!migrated) {
        
        // Get custom foods from IndexedDB
        const customFoods = await readIndexedFoods() as LocalFoodItem[];
        
        // Get built-in foods from JSON
        const builtInFoods = comprehensiveFoods as LocalFoodItem[];
        
        // Load previously deleted built-in food IDs
        const deletedIds = this.loadLegacyDeletedFoodIds();
        
        // Filter out deleted built-in foods
        const activeBuiltInFoods = builtInFoods.filter(food => !deletedIds.has(food.id));
        
        // Combine all foods
        const existingFoods = this.getFoodsFromStorage();
        const hasExistingDatabase = localStorage.getItem(this.FOOD_DATABASE_KEY) !== null;
        const allFoods = [...new Map([
          ...(hasExistingDatabase ? [] : activeBuiltInFoods), ...customFoods, ...existingFoods
        ].map(food => [food.id, food])).values()];
        
        // Save to localStorage
        localStorage.setItem(this.FOOD_DATABASE_KEY, JSON.stringify(allFoods));
        localStorage.setItem(this.MIGRATION_FLAG_KEY, 'true');

        // Keep legacy records intact for rollback/export at the old origin.
      }
      
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
    const stored = localStorage.getItem(this.FOOD_DATABASE_KEY);
    if (stored === null) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!foodDataSchema.array().safeParse(parsed).success) throw new Error('Saved food database is unreadable. Original data has not been changed.');
    return parsed as LocalFoodItem[];
  }

  // Save all foods to localStorage
  private saveFoodsToStorage(foods: LocalFoodItem[]): void {
    // Let existing operation catch blocks report failure; never claim success
    // after quota/denial or persist values that the backup contract rejects.
    if (!foodDataSchema.array().safeParse(foods).success) {
      throw new Error('Food data is invalid. Check serving quantity and nutrition values.');
    }
    localStorage.setItem(this.FOOD_DATABASE_KEY, JSON.stringify(foods));
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

      return sortedResults;

    } catch (error) {
      console.error('Error searching local foods:', error);
      return [];
    }
  }

  // Get product by barcode from local data
  async getProductByBarcode(barcode: string): Promise<LocalFoodItem | null> {
    await this.ready;
    const identity = barcodeIdentity(barcode);
    return this.getFoodsFromStorage().find(food => {
      if (!food.barcode) return false;
      try { return barcodeIdentity(food.barcode) === identity; } catch { return false; }
    }) ?? null;
  }

  // A reviewed scanner product is an explicit addition, never an upsert.
  async saveReviewedProduct(input: LocalFoodItem): Promise<LocalFoodItem> {
    await this.ready;
    if (!foodDataSchema.safeParse(input).success) throw new Error('Check the serving and nutrition values before saving.');
    const foods = this.getFoodsFromStorage();
    if (foods.some(food => food.id === input.id || (input.barcode && food.barcode && (() => {
      try { return barcodeIdentity(food.barcode!) === barcodeIdentity(input.barcode!); } catch { return false; }
    })()))) throw new Error('This product is already saved. Log it without saving, or edit it in Food Database. No saved food was overwritten.');
    const saved = { ...input, id: `custom-${crypto.randomUUID()}` };
    this.saveFoodsToStorage([...foods, saved]);
    return saved;
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
        quantity: input.quantity,
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

      // Only a known mass unit supports a per-100g reference; cups/pieces
      // and arbitrary servings have no inferred density or weight.
      customFood.nutritionPer100g = per100gForFood(customFood);

      // Add to localStorage
      const foods = this.getFoodsFromStorage();
      foods.push(customFood);
      this.saveFoodsToStorage(foods);

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

      if (Object.keys(input).some(key => key === 'quantity' || key === 'unit' || nutrientFields.includes(key as typeof nutrientFields[number]))) {
        updatedFood.nutritionPer100g = per100gForFood(updatedFood);
      }

      foods[foodIndex] = updatedFood;
      this.saveFoodsToStorage(foods);

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
