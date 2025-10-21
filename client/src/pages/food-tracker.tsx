import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Search, X, Edit2, Save, X as Cancel } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { getTodayString } from '@/lib/date-utils';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';
import { localFoodService, LocalFoodItem, FoodEntry as LocalFoodEntry, FoodUnit as LocalFoodUnit } from '@/lib/local-food-service';
import { useToast } from '@/hooks/use-toast';

// Strong typing for nutrition data and units
type FoodUnit = 'g' | 'oz' | 'cup' | 'piece' | 'serving';

interface NutritionPer100g {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number; // in mg
  saturatedFat?: number;
}

interface FoodEntry {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  
  // Serving info
  quantity: number;
  unit: FoodUnit;
  servings?: number; // Number of servings multiplier (defaults to 1)
  
  // Basic macros (calculated for actual serving)
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  
  // Extended nutrition (calculated for actual serving)
  fiber?: number;
  sugar?: number;
  sodium?: number; // in mg
  saturatedFat?: number;
  
  // Metadata
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: string;
  
  // API reference data (per 100g for future calculations)
  nutritionPer100g?: NutritionPer100g;
}

interface MacroTargets {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

// Utility function for calculating nutrition values from serving sizes
const calculateNutritionForServing = (
  nutritionPer100g: NutritionPer100g,
  quantity: number,
  unit: FoodUnit,
  foodSpecificServingGrams?: number // from API when available
) => {
  // Convert user quantity to grams for calculation
  const gramsConversion: Record<FoodUnit, number> = {
    'g': 1,
    'oz': 28.35,
    'cup': 240, // generic, should use food-specific when available
    'piece': 100, // generic, should use food-specific when available
    'serving': foodSpecificServingGrams || 100 // prefer API serving size
  };
  
  const totalGrams = quantity * gramsConversion[unit];
  const multiplier = totalGrams / 100;
  
  return {
    calories: Math.round(nutritionPer100g.calories * multiplier),
    carbs: Math.round(nutritionPer100g.carbs * multiplier * 10) / 10,
    protein: Math.round(nutritionPer100g.protein * multiplier * 10) / 10,
    fat: Math.round(nutritionPer100g.fat * multiplier * 10) / 10,
    fiber: nutritionPer100g.fiber ? Math.round(nutritionPer100g.fiber * multiplier * 10) / 10 : undefined,
    sugar: nutritionPer100g.sugar ? Math.round(nutritionPer100g.sugar * multiplier * 10) / 10 : undefined,
    sodium: nutritionPer100g.sodium ? Math.round(nutritionPer100g.sodium * multiplier) : undefined,
    saturatedFat: nutritionPer100g.saturatedFat ? Math.round(nutritionPer100g.saturatedFat * multiplier * 10) / 10 : undefined
  };
};

// Validation helper
const validateNutritionInputs = (calories: string, carbs: string, protein: string, fat: string, quantity: string) => {
  const caloriesNum = parseFloat(calories);
  const carbsNum = parseFloat(carbs);
  const proteinNum = parseFloat(protein);
  const fatNum = parseFloat(fat);
  const quantityNum = parseFloat(quantity);
  
  return {
    isValid: !isNaN(caloriesNum) && !isNaN(carbsNum) && !isNaN(proteinNum) && !isNaN(fatNum) && !isNaN(quantityNum) &&
             caloriesNum >= 0 && carbsNum >= 0 && proteinNum >= 0 && fatNum >= 0 && quantityNum > 0,
    values: { caloriesNum, carbsNum, proteinNum, fatNum, quantityNum }
  };
};

export default function FoodTrackerPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [macroTargets, setMacroTargets] = useState<MacroTargets>({
    calories: 2000,
    carbs: 250,
    protein: 150,
    fat: 67
  });
  
  // Form states
  const [foodName, setFoodName] = useState('');
  const [brand, setBrand] = useState('');
  const [barcode, setBarcode] = useState('');
  
  // Serving size states
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<FoodUnit>('serving');
  
  // Basic nutrition states
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  
  // Extended nutrition states
  const [fiber, setFiber] = useState('');
  const [sugar, setSugar] = useState('');
  const [sodium, setSodium] = useState('');
  const [saturatedFat, setSaturatedFat] = useState('');
  
  // UI states
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [showExtendedNutrition, setShowExtendedNutrition] = useState(false);
  
  // Collapsible states
  const [breakfastOpen, setBreakfastOpen] = useState(false);
  const [lunchOpen, setLunchOpen] = useState(false);
  const [dinnerOpen, setDinnerOpen] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  
  // Search states
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMeal, setSearchMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [allFoodHistory, setAllFoodHistory] = useState<FoodEntry[]>([]);

  // Custom food states
  const [customFoodOpen, setCustomFoodOpen] = useState(false);
  const [customFoodMeal, setCustomFoodMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [customFoodData, setCustomFoodData] = useState({
    name: '',
    brand: '',
    quantity: '100',
    unit: 'g' as FoodUnit,
    calories: '0',
    carbs: '0',
    protein: '0',
    fat: '0',
    fiber: '0',
    sugar: '0',
    sodium: '0',
    saturatedFat: '0',
    potassium: '0',
    cholesterol: '0',
    vitaminA: '0',
    vitaminC: '0',
    calcium: '0',
    iron: '0'
  });
  const [searchResults, setSearchResults] = useState<LocalFoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null); // Track entry being edited
  
  // Add Entry Modal states (when adding from search/recent)
  const [addEntryOpen, setAddEntryOpen] = useState(false);
  const [addingFood, setAddingFood] = useState<LocalFoodItem | null>(null);
  const [addEntryServings, setAddEntryServings] = useState('1');
  const [addEntryMeal, setAddEntryMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  
  // Edit Entry Modal states (when editing logged food in meals)
  const [editEntryOpen, setEditEntryOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [editEntryServings, setEditEntryServings] = useState('1');
  const [editEntryMeal, setEditEntryMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  
  // Edit states
  const [editingFood, setEditingFood] = useState<FoodEntry | null>(null);
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editCalories, setEditCalories] = useState('');
  const [editCarbs, setEditCarbs] = useState('');
  const [editProtein, setEditProtein] = useState('');
  const [editFat, setEditFat] = useState('');
  const [editFiber, setEditFiber] = useState('');
  const [editSugar, setEditSugar] = useState('');
  const [editSodium, setEditSodium] = useState('');
  const [editSaturatedFat, setEditSaturatedFat] = useState('');

  // Check if we came from dashboard
  const fromDashboard = new URLSearchParams(window.location.search).get('from') === 'dashboard';
  
  const handleBack = () => {
    navigate('/wellness');
  };

  // Load data on component mount
  useEffect(() => {
    // Load today's food entries
    const today = getTodayString();
    const stored = safeParseJSON(localStorage.getItem(`fitcircle_food_${today}`), []);
    setFoodEntries(stored);

    // Load macro targets directly from what fitness calculator displays/stores
    const loadMacroTargets = () => {
      // Try to get the calculated values directly from fitness calculator's localStorage
      const storedCalories = localStorage.getItem('fitness_calc_target_calories');
      const storedCarbs = localStorage.getItem('fitness_calc_target_carbs');
      const storedProtein = localStorage.getItem('fitness_calc_target_protein');
      const storedFat = localStorage.getItem('fitness_calc_target_fat');
      
      if (storedCalories && storedCarbs && storedProtein && storedFat) {
        // Use the exact values the fitness calculator calculated and stored
        setMacroTargets({
          calories: parseInt(storedCalories),
          carbs: parseInt(storedCarbs),
          protein: parseInt(storedProtein),
          fat: parseInt(storedFat)
        });
      } else {
        // Fallback: keep current values if nothing stored yet
        // This happens when user hasn't visited fitness calculator yet
        console.log('No fitness calculator data found, keeping current values');
      }
    };

    loadMacroTargets();
    
    // Set up polling for changes from fitness calculator
    const interval = setInterval(loadMacroTargets, 2000);
    return () => clearInterval(interval);
  }, []);

  // Save food entries whenever they change
  useEffect(() => {
    const today = getTodayString();
    localStorage.setItem(`fitcircle_food_${today}`, JSON.stringify(foodEntries));
  }, [foodEntries]);

  // Load all food history for search functionality
  useEffect(() => {
    const loadAllFoodHistory = () => {
      const allFoods: FoodEntry[] = [];
      const seenFoods = new Set<string>(); // Track unique food names to avoid duplicates
      
      // Get all localStorage keys that start with 'fitcircle_food_'
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fitcircle_food_')) {
          const entries = safeParseJSON(localStorage.getItem(key), []) as FoodEntry[];
          entries.forEach(entry => {
            // Handle legacy entries that might not have the new fields
            const enhancedEntry: FoodEntry = {
              ...entry,
              // For legacy entries without serving info, assume "1 serving" to avoid misleading "100g" labels
              quantity: entry.quantity || 1,
              unit: (entry.unit as FoodUnit) || 'serving',
              brand: entry.brand,
              barcode: entry.barcode,
              fiber: entry.fiber,
              sugar: entry.sugar,
              sodium: entry.sodium,
              saturatedFat: entry.saturatedFat,
              nutritionPer100g: entry.nutritionPer100g
            };
            
            // Include barcode in deduplication for API-scanned foods
            const foodKey = `${enhancedEntry.name}-${enhancedEntry.brand || ''}-${enhancedEntry.barcode || ''}-${enhancedEntry.calories}-${enhancedEntry.carbs}-${enhancedEntry.protein}-${enhancedEntry.fat}`;
            if (!seenFoods.has(foodKey)) {
              seenFoods.add(foodKey);
              // Create a new entry without meal specification for search
              allFoods.push({
                ...enhancedEntry,
                id: `search-${enhancedEntry.id}`,
                meal: 'breakfast' // Default value, will be overridden when adding
              });
            }
          });
        }
      }
      
      setAllFoodHistory(allFoods);
    };
    
    loadAllFoodHistory();
  }, [foodEntries]); // Reload when food entries change

  const handleAddFood = () => {
    if (!foodName.trim() || !calories || !carbs || !protein || !fat || !quantity) return;

    const validation = validateNutritionInputs(calories, carbs, protein, fat, quantity);
    if (!validation.isValid) {
      console.error('Invalid numeric values provided for food entry');
      return;
    }
    
    const { caloriesNum, carbsNum, proteinNum, fatNum, quantityNum } = validation.values;
    const fiberNum = fiber ? parseFloat(fiber) : undefined;
    const sugarNum = sugar ? parseFloat(sugar) : undefined;
    const sodiumNum = sodium ? parseFloat(sodium) : undefined;
    const saturatedFatNum = saturatedFat ? parseFloat(saturatedFat) : undefined;

    const newEntry: FoodEntry = {
      id: Date.now().toString(),
      name: foodName.trim(),
      brand: brand.trim() || undefined,
      barcode: barcode.trim() || undefined,
      quantity: quantityNum,
      unit,
      calories: caloriesNum,
      carbs: carbsNum,
      protein: proteinNum,
      fat: fatNum,
      fiber: fiberNum,
      sugar: sugarNum,
      sodium: sodiumNum,
      saturatedFat: saturatedFatNum,
      servings: 1,
      meal: selectedMeal,
      timestamp: new Date().toISOString()
    };

    setFoodEntries(prev => [...prev, newEntry]);
    
    // Clear form
    setFoodName('');
    setBrand('');
    setBarcode('');
    setQuantity('1');
    setUnit('serving');
    setCalories('');
    setCarbs('');
    setProtein('');
    setFat('');
    setFiber('');
    setSugar('');
    setSodium('');
    setSaturatedFat('');
  };

  const handleDeleteFood = (id: string) => {
    setFoodEntries(prev => prev.filter(entry => entry.id !== id));
  };

  // Search functions
  const filteredFoodHistory = allFoodHistory.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Local search with throttling
  const performLocalSearch = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const products = await localFoodService.searchProducts(query, 8);
      setSearchResults(products);
    } catch (error) {
      console.error('Local search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Throttled local search
  useEffect(() => {
    if (searchQuery) {
      const timeoutId = setTimeout(() => {
        performLocalSearch(searchQuery);
      }, 300); // 300ms delay to avoid too many searches
      
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchMeal]);
  
  // Function to open search for specific meal
  const openSearchForMeal = (meal: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setSearchMeal(meal);
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(true);
  };

  // Function to open custom food form for specific meal
  const openCustomFoodForMeal = (meal: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setCustomFoodMeal(meal);
    setCustomFoodData({
      name: '',
      brand: '',
      quantity: '100',
      unit: 'g' as FoodUnit,
      calories: '0',
      carbs: '0',
      protein: '0',
      fat: '0',
      fiber: '0',
      sugar: '0',
      sodium: '0',
      saturatedFat: '0',
      potassium: '0',
      cholesterol: '0',
      vitaminA: '0',
      vitaminC: '0',
      calcium: '0',
      iron: '0'
    });
    setSearchOpen(false); // Close search dialog
    setCustomFoodOpen(true);
  };

  // Function to handle custom food submission (just save to database, don't log)
  const handleCustomFoodSubmit = async () => {
    // Validate required field (name only)
    if (!customFoodData.name.trim()) {
      toast({
        title: "Missing Required Information",
        description: "Please fill in the food name.",
        variant: "destructive"
      });
      return;
    }

    // Parse values, defaulting to 0 if empty or invalid
    const parseOrDefault = (value: string) => {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    const foodInput = {
      name: customFoodData.name.trim(),
      brand: customFoodData.brand.trim() || undefined,
      quantity: parseOrDefault(customFoodData.quantity) || 100,
      unit: customFoodData.unit,
      calories: parseOrDefault(customFoodData.calories),
      carbs: parseOrDefault(customFoodData.carbs),
      protein: parseOrDefault(customFoodData.protein),
      fat: parseOrDefault(customFoodData.fat),
      fiber: customFoodData.fiber ? parseOrDefault(customFoodData.fiber) : undefined,
      sugar: customFoodData.sugar ? parseOrDefault(customFoodData.sugar) : undefined,
      sodium: customFoodData.sodium ? parseOrDefault(customFoodData.sodium) : undefined,
      saturatedFat: customFoodData.saturatedFat ? parseOrDefault(customFoodData.saturatedFat) : undefined,
      potassium: customFoodData.potassium ? parseOrDefault(customFoodData.potassium) : undefined,
      cholesterol: customFoodData.cholesterol ? parseOrDefault(customFoodData.cholesterol) : undefined,
      vitaminA: customFoodData.vitaminA ? parseOrDefault(customFoodData.vitaminA) : undefined,
      vitaminC: customFoodData.vitaminC ? parseOrDefault(customFoodData.vitaminC) : undefined,
      calcium: customFoodData.calcium ? parseOrDefault(customFoodData.calcium) : undefined,
      iron: customFoodData.iron ? parseOrDefault(customFoodData.iron) : undefined
    };

    try {
      let result;
      
      // Check if we're editing an existing food or creating a new one
      if (editingEntryId) {
        // Update existing food
        result = await localFoodService.updateCustomFood(editingEntryId, foodInput);
      } else {
        // Create new food
        result = await localFoodService.addCustomFood(foodInput);
      }

      if (result.success && result.food) {
        toast({
          title: editingEntryId ? "Food Updated Successfully!" : "Food Created Successfully!",
          description: `${result.food.name} has been ${editingEntryId ? 'updated in' : 'saved to'} your food database.`
        });

        // Refresh search results if we have a search query
        if (searchQuery) {
          const results = await localFoodService.searchProducts(searchQuery);
          setSearchResults(results);
        }

        setCustomFoodOpen(false);
        setEditingEntryId(null); // Clear editing state
      } else {
        toast({
          title: editingEntryId ? "Failed to Update Food" : "Failed to Create Food",
          description: result.error || `Something went wrong while ${editingEntryId ? 'updating' : 'creating'} your custom food.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving custom food:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingEntryId ? 'update' : 'create'} custom food. Please try again.`,
        variant: "destructive"
      });
    }
  };

  // Function to handle Add Entry submission (log food with servings)
  const handleSubmitAddEntry = () => {
    if (!addingFood) return;

    const servings = parseFloat(addEntryServings) || 1;

    // Convert food to entry format with servings
    const newEntry: FoodEntry = {
      id: Date.now().toString(),
      name: addingFood.name,
      brand: addingFood.brand,
      barcode: addingFood.barcode,
      quantity: addingFood.quantity,
      unit: addingFood.unit,
      calories: addingFood.calories,
      carbs: addingFood.carbs,
      protein: addingFood.protein,
      fat: addingFood.fat,
      fiber: addingFood.fiber,
      sugar: addingFood.sugar,
      sodium: addingFood.sodium,
      saturatedFat: addingFood.saturatedFat,
      servings: servings,
      meal: addEntryMeal,
      timestamp: new Date().toISOString()
    };

    const updatedEntries = [...foodEntries, newEntry];
    setFoodEntries(updatedEntries);

    // Save to localStorage
    const today = getTodayString();
    try {
      localStorage.setItem(STORAGE_KEYS.FOOD_TRACKER + today, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Error saving food entries to localStorage:', error);
    }

    toast({
      title: "Food Logged!",
      description: `${addingFood.name} has been added to your ${addEntryMeal}.`
    });

    setAddEntryOpen(false);
    setAddingFood(null);
  };

  // Function to open Add Entry modal when clicking + on a food from search/recent
  const handleAddFromSearch = (food: LocalFoodItem) => {
    setAddingFood(food);
    setAddEntryServings('1'); // Default to 1 serving
    setAddEntryMeal(searchMeal);
    setSearchOpen(false);
    setAddEntryOpen(true);
  };

  // Function to edit a food item from search/recent (opens Custom Food modal with existing values)
  const handleEditFoodFromSearch = (food: LocalFoodItem) => {
    setCustomFoodData({
      name: food.name,
      brand: food.brand || '',
      quantity: food.quantity.toString(),
      unit: food.unit,
      calories: food.calories.toString(),
      carbs: food.carbs.toString(),
      protein: food.protein.toString(),
      fat: food.fat.toString(),
      fiber: food.fiber?.toString() || '',
      sugar: food.sugar?.toString() || '',
      sodium: food.sodium?.toString() || '',
      saturatedFat: food.saturatedFat?.toString() || '',
      potassium: food.potassium?.toString() || '',
      cholesterol: food.cholesterol?.toString() || '',
      vitaminA: food.vitaminA?.toString() || '',
      vitaminC: food.vitaminC?.toString() || '',
      calcium: food.calcium?.toString() || '',
      iron: food.iron?.toString() || ''
    });
    setEditingEntryId(food.id); // Store ID to know we're editing
    setSearchOpen(false);
    setCustomFoodOpen(true);
  };

  // Function to delete food from database with confirmation
  const handleDeleteFoodFromDatabase = async (food: LocalFoodItem) => {
    // Show confirmation prompt
    const confirmed = window.confirm(
      `Are you sure you want to delete "${food.name}"${food.brand ? ` by ${food.brand}` : ''} from your database? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const result = await localFoodService.deleteCustomFood(food.id);
      
      if (result.success) {
        toast({
          title: "Food Deleted",
          description: `${food.name} has been removed from your database.`
        });
        
        // Refresh the search results if there's a search query
        if (searchQuery) {
          const results = await localFoodService.searchProducts(searchQuery);
          setSearchResults(results);
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete food.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the food.",
        variant: "destructive"
      });
    }
  };

  // Function to open the simple Edit Entry modal (adjust servings/meal only)
  const handleEditFoodEntry = (entry: FoodEntry) => {
    setEditingEntry(entry);
    setEditEntryServings((entry.servings || 1).toString()); // Show current servings value
    setEditEntryMeal(entry.meal);
    setEditEntryOpen(true);
  };

  // Function to save the edited entry (servings/meal changes)
  const handleSaveEditEntry = () => {
    if (!editingEntry) return;

    const newServings = parseFloat(editEntryServings) || 1;
    
    // ONLY update servings and meal - base nutritional values stay unchanged
    const updatedEntry: FoodEntry = {
      ...editingEntry,
      servings: newServings,
      meal: editEntryMeal,
      timestamp: new Date().toISOString()
    };

    const updatedEntries = foodEntries.map(entry => 
      entry.id === editingEntry.id ? updatedEntry : entry
    );
    setFoodEntries(updatedEntries);

    // Save to localStorage
    const today = getTodayString();
    try {
      localStorage.setItem(STORAGE_KEYS.FOOD_TRACKER + today, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Error saving food entries to localStorage:', error);
    }

    toast({
      title: "Entry Updated!",
      description: `${editingEntry.name} has been updated.`
    });

    setEditEntryOpen(false);
    setEditingEntry(null);
  };

  // Edit functions
  const handleEditFood = (food: FoodEntry) => {
    setEditingFood(food);
    setEditName(food.name);
    setEditBrand(food.brand || '');
    setEditQuantity(food.quantity.toString());
    setEditUnit(food.unit);
    setEditCalories(food.calories.toString());
    setEditCarbs(food.carbs.toString());
    setEditProtein(food.protein.toString());
    setEditFat(food.fat.toString());
    setEditFiber(food.fiber?.toString() || '');
    setEditSugar(food.sugar?.toString() || '');
    setEditSodium(food.sodium?.toString() || '');
    setEditSaturatedFat(food.saturatedFat?.toString() || '');
  };

  const handleSaveEdit = () => {
    if (!editingFood || !editName.trim() || !editCalories || !editCarbs || !editProtein || !editFat || !editQuantity) return;

    const updatedEntry: FoodEntry = {
      ...editingFood,
      name: editName.trim(),
      brand: editBrand.trim() || undefined,
      quantity: parseFloat(editQuantity),
      unit: editUnit as FoodUnit,
      calories: parseFloat(editCalories),
      carbs: parseFloat(editCarbs),
      protein: parseFloat(editProtein),
      fat: parseFloat(editFat),
      fiber: editFiber ? parseFloat(editFiber) : undefined,
      sugar: editSugar ? parseFloat(editSugar) : undefined,
      sodium: editSodium ? parseFloat(editSodium) : undefined,
      saturatedFat: editSaturatedFat ? parseFloat(editSaturatedFat) : undefined
    };

    setFoodEntries(prev => prev.map(entry => 
      entry.id === editingFood.id ? updatedEntry : entry
    ));

    // Reset edit state
    setEditingFood(null);
    setEditName('');
    setEditBrand('');
    setEditQuantity('');
    setEditUnit('');
    setEditCalories('');
    setEditCarbs('');
    setEditProtein('');
    setEditFat('');
    setEditFiber('');
    setEditSugar('');
    setEditSodium('');
    setEditSaturatedFat('');
  };

  const handleCancelEdit = () => {
    setEditingFood(null);
    setEditName('');
    setEditBrand('');
    setEditQuantity('');
    setEditUnit('');
    setEditCalories('');
    setEditCarbs('');
    setEditProtein('');
    setEditFat('');
    setEditFiber('');
    setEditSugar('');
    setEditSodium('');
    setEditSaturatedFat('');
  };

  const handleEditFromSearch = (food: FoodEntry) => {
    handleEditFood(food);
    setSearchOpen(false);
  };

  // Calculate totals
  const totals = foodEntries.reduce(
    (acc, entry) => ({
      calories: acc.calories + (entry.calories * (entry.servings || 1)),
      carbs: acc.carbs + (entry.carbs * (entry.servings || 1)),
      protein: acc.protein + (entry.protein * (entry.servings || 1)),
      fat: acc.fat + (entry.fat * (entry.servings || 1))
    }),
    { calories: 0, carbs: 0, protein: 0, fat: 0 }
  );

  // Calculate progress percentages
  const caloriesProgress = Math.min((totals.calories / macroTargets.calories) * 100, 100);
  const carbsProgress = Math.min((totals.carbs / macroTargets.carbs) * 100, 100);
  const proteinProgress = Math.min((totals.protein / macroTargets.protein) * 100, 100);
  const fatProgress = Math.min((totals.fat / macroTargets.fat) * 100, 100);

  // Calculate meal totals
  const getMealEntries = (meal: 'breakfast' | 'lunch' | 'dinner' | 'snack') => 
    foodEntries.filter(entry => entry.meal === meal);

  const getMealTotals = (meal: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    const mealEntries = getMealEntries(meal);
    return mealEntries.reduce(
      (acc, entry) => ({
        calories: acc.calories + (entry.calories * (entry.servings || 1)),
        carbs: acc.carbs + (entry.carbs * (entry.servings || 1)),
        protein: acc.protein + (entry.protein * (entry.servings || 1)),
        fat: acc.fat + (entry.fat * (entry.servings || 1))
      }),
      { calories: 0, carbs: 0, protein: 0, fat: 0 }
    );
  };

  // Circular progress component
  const CircularProgress = ({ 
    progress, 
    size = 200, 
    strokeWidth = 12, 
    color = "rgb(34, 197, 94)",
    children 
  }: { 
    progress: number; 
    size?: number; 
    strokeWidth?: number; 
    color?: string;
    children?: React.ReactNode;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgb(55, 65, 81)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-in-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="fitcircle-page">
      <div className="fitcircle-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="fitcircle-page-title">Food Tracker</h1>
          <div className="w-5" />
        </div>

        {/* Large Circular Calorie Progress */}
        <div className="flex flex-col items-center mb-8">
          <CircularProgress 
            progress={caloriesProgress} 
            size={220} 
            strokeWidth={16}
            color="rgb(34, 197, 94)"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">
                {Math.round(totals.calories)}
              </div>
              <div className="text-sm text-gray-400">
                / {macroTargets.calories} cal
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {Math.round(caloriesProgress)}% complete
              </div>
            </div>
          </CircularProgress>
        </div>

        {/* Macro Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="fitcircle-card text-center">
            <div className="text-lg font-bold text-blue-400">
              {Math.round(totals.carbs)}g
            </div>
            <div className="text-xs fitcircle-text-muted">
              / {macroTargets.carbs}g
            </div>
            <div className="text-xs fitcircle-text-secondary mt-1">Carbs</div>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(carbsProgress, 100)}%` }}
              />
            </div>
          </div>
          
          <div className="fitcircle-card text-center">
            <div className="text-lg font-bold text-red-400">
              {Math.round(totals.protein)}g
            </div>
            <div className="text-xs fitcircle-text-muted">
              / {macroTargets.protein}g
            </div>
            <div className="text-xs fitcircle-text-secondary mt-1">Protein</div>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
              <div 
                className="bg-red-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(proteinProgress, 100)}%` }}
              />
            </div>
          </div>
          
          <div className="fitcircle-card text-center">
            <div className="text-lg font-bold text-yellow-400">
              {Math.round(totals.fat)}g
            </div>
            <div className="text-xs fitcircle-text-muted">
              / {macroTargets.fat}g
            </div>
            <div className="text-xs fitcircle-text-secondary mt-1">Fat</div>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
              <div 
                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(fatProgress, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Search Dialog - triggered by meal 'Add food' buttons */}
        <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
          <DialogContent className="bg-gray-800 border-gray-600 text-white rounded-2xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                Add to {searchMeal.charAt(0).toUpperCase() + searchMeal.slice(1)}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search foods"
                  className="bg-gray-700 border-gray-600 text-white rounded-xl pl-10 pr-10"
                  data-testid="input-search"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-1"
                    data-testid="button-clear-search"
                  >
                    <Cancel className="w-4 h-4" />
                  </Button>
                )}
                {isSearching && (
                  <div className="absolute inset-x-0 top-full mt-1 text-center">
                    <div className="text-xs text-gray-400">Searching...</div>
                  </div>
                )}
              </div>

              {/* Create Custom Food Button */}
              <Button
                onClick={() => openCustomFoodForMeal(searchMeal)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center"
                data-testid="button-create-custom-food"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Custom Food
              </Button>
                  
              
              {/* Food List */}
              <div className="max-h-80 overflow-y-auto">
                {searchQuery ? (
                  // Search Results
                  searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((food) => (
                        <div key={food.id} className="bg-gray-700/30 border border-gray-600/50 rounded-xl p-3 hover:bg-gray-700/50 transition-colors" data-testid={`row-food-${food.id}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-white text-sm">
                                {food.name}
                                {food.brand && <span className="text-gray-400 font-normal text-xs ml-1">{food.brand}</span>}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {food.quantity} {food.unit}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {food.calories} cal • {food.carbs}g carbs • {food.protein}g protein • {food.fat}g fat
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 ml-3 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditFoodFromSearch(food)}
                                className="text-slate-400 hover:text-slate-200 hover:bg-gray-600 rounded-full w-8 h-8 p-0"
                                data-testid={`button-edit-${food.id}`}
                                title="Edit food"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAddFromSearch(food)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded-full w-8 h-8 p-0"
                                data-testid={`button-add-${food.id}`}
                                title="Add to meal"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteFoodFromDatabase(food)}
                                className="text-red-400 hover:text-red-300 hover:bg-gray-600 rounded-full w-8 h-8 p-0"
                                data-testid={`button-delete-db-${food.id}`}
                                title="Delete from database"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !isSearching ? (
                    <div className="text-center text-gray-500 py-8 text-sm">
                      No results found
                    </div>
                  ) : null
                ) : (
                  // Recent Foods (when no search query)
                  filteredFoodHistory.length > 0 ? (
                    <div className="space-y-2">
                      {filteredFoodHistory.slice(0, 10).map((food) => (
                        <div key={food.id} className="bg-gray-700/30 border border-gray-600/50 rounded-xl p-3 hover:bg-gray-700/50 transition-colors" data-testid={`row-food-${food.id}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-white text-sm">
                                {food.name}
                                {food.brand && <span className="text-gray-400 font-normal text-xs ml-1">{food.brand}</span>}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {food.quantity} {food.unit}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {food.calories} cal • {food.carbs}g carbs • {food.protein}g protein • {food.fat}g fat
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 ml-3 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAddFromSearch(food)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded-full w-8 h-8 p-0"
                                data-testid={`button-add-${food.id}`}
                                title="Add to meal"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8 text-sm">
                      No recent foods
                    </div>
                  )
                )}
              </div>
                </div>
              </DialogContent>
        </Dialog>

        {/* Meal Sections */}
        <div className="space-y-4">
          {/* Breakfast */}
          <Collapsible open={breakfastOpen} onOpenChange={setBreakfastOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-lg font-semibold text-white">Breakfast</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-400">
                  {Math.round(getMealTotals('breakfast').calories)} cal
                </span>
                {breakfastOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-2">
                {getMealEntries('breakfast').map((entry) => (
                  <div key={entry.id} className="bg-gray-700 rounded-xl p-3 flex justify-between items-start">
                    <div 
                      className="flex-1 cursor-pointer hover:bg-gray-600/30 -m-3 p-3 rounded-xl transition-colors"
                      onClick={() => handleEditFoodEntry(entry)}
                      data-testid={`food-item-${entry.id}`}
                    >
                      <h3 className="font-medium text-white text-sm">
                        {entry.name}
                        {entry.brand && <span className="text-gray-400 font-normal"> • {entry.brand}</span>}
                      </h3>
                      <div className="text-xs text-gray-400 mt-1">
                        {entry.quantity * (entry.servings || 1)}{entry.unit} • {Math.round(entry.calories * (entry.servings || 1))} cal • {Math.round(entry.carbs * (entry.servings || 1))}g carbs • {Math.round(entry.protein * (entry.servings || 1))}g protein • {Math.round(entry.fat * (entry.servings || 1))}g fat
                        {entry.fiber && <span> • {Math.round(entry.fiber * (entry.servings || 1))}g fiber</span>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFood(entry.id);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-gray-600 rounded-xl p-1 ml-2"
                      data-testid={`button-delete-${entry.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {getMealEntries('breakfast').length === 0 && (
                  <div className="text-center text-gray-500 py-4 text-sm">
                    No breakfast items logged
                  </div>
                )}
                
                {/* Add Food Button */}
                <Button
                  onClick={() => openSearchForMeal('breakfast')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center"
                  data-testid="button-add-breakfast"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Food
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Lunch */}
          <Collapsible open={lunchOpen} onOpenChange={setLunchOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-lg font-semibold text-white">Lunch</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-400">
                  {Math.round(getMealTotals('lunch').calories)} cal
                </span>
                {lunchOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-2">
                {getMealEntries('lunch').map((entry) => (
                  <div key={entry.id} className="bg-gray-700 rounded-xl p-3 flex justify-between items-start">
                    <div 
                      className="flex-1 cursor-pointer hover:bg-gray-600/30 -m-3 p-3 rounded-xl transition-colors"
                      onClick={() => handleEditFoodEntry(entry)}
                      data-testid={`food-item-${entry.id}`}
                    >
                      <h3 className="font-medium text-white text-sm">
                        {entry.name}
                        {entry.brand && <span className="text-gray-400 font-normal"> • {entry.brand}</span>}
                      </h3>
                      <div className="text-xs text-gray-400 mt-1">
                        {entry.quantity * (entry.servings || 1)}{entry.unit} • {Math.round(entry.calories * (entry.servings || 1))} cal • {Math.round(entry.carbs * (entry.servings || 1))}g carbs • {Math.round(entry.protein * (entry.servings || 1))}g protein • {Math.round(entry.fat * (entry.servings || 1))}g fat
                        {entry.fiber && <span> • {Math.round(entry.fiber * (entry.servings || 1))}g fiber</span>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFood(entry.id);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-gray-600 rounded-xl p-1 ml-2"
                      data-testid={`button-delete-${entry.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {getMealEntries('lunch').length === 0 && (
                  <div className="text-center text-gray-500 py-4 text-sm">
                    No lunch items logged
                  </div>
                )}
                
                {/* Add Food Button */}
                <Button
                  onClick={() => openSearchForMeal('lunch')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center"
                  data-testid="button-add-lunch"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Food
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Dinner */}
          <Collapsible open={dinnerOpen} onOpenChange={setDinnerOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-lg font-semibold text-white">Dinner</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-400">
                  {Math.round(getMealTotals('dinner').calories)} cal
                </span>
                {dinnerOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-2">
                {getMealEntries('dinner').map((entry) => (
                  <div key={entry.id} className="bg-gray-700 rounded-xl p-3 flex justify-between items-start">
                    <div 
                      className="flex-1 cursor-pointer hover:bg-gray-600/30 -m-3 p-3 rounded-xl transition-colors"
                      onClick={() => handleEditFoodEntry(entry)}
                      data-testid={`food-item-${entry.id}`}
                    >
                      <h3 className="font-medium text-white text-sm">
                        {entry.name}
                        {entry.brand && <span className="text-gray-400 font-normal"> • {entry.brand}</span>}
                      </h3>
                      <div className="text-xs text-gray-400 mt-1">
                        {entry.quantity * (entry.servings || 1)}{entry.unit} • {Math.round(entry.calories * (entry.servings || 1))} cal • {Math.round(entry.carbs * (entry.servings || 1))}g carbs • {Math.round(entry.protein * (entry.servings || 1))}g protein • {Math.round(entry.fat * (entry.servings || 1))}g fat
                        {entry.fiber && <span> • {Math.round(entry.fiber * (entry.servings || 1))}g fiber</span>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFood(entry.id);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-gray-600 rounded-xl p-1 ml-2"
                      data-testid={`button-delete-${entry.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {getMealEntries('dinner').length === 0 && (
                  <div className="text-center text-gray-500 py-4 text-sm">
                    No dinner items logged
                  </div>
                )}
                
                {/* Add Food Button */}
                <Button
                  onClick={() => openSearchForMeal('dinner')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center"
                  data-testid="button-add-dinner"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Food
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Snack */}
          <Collapsible open={snackOpen} onOpenChange={setSnackOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-lg font-semibold text-white">Snack</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-400">
                  {Math.round(getMealTotals('snack').calories)} cal
                </span>
                {snackOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-2">
                {getMealEntries('snack').map((entry) => (
                  <div key={entry.id} className="bg-gray-700 rounded-xl p-3 flex justify-between items-start">
                    <div 
                      className="flex-1 cursor-pointer hover:bg-gray-600/30 -m-3 p-3 rounded-xl transition-colors"
                      onClick={() => handleEditFoodEntry(entry)}
                      data-testid={`food-item-${entry.id}`}
                    >
                      <h3 className="font-medium text-white text-sm">
                        {entry.name}
                        {entry.brand && <span className="text-gray-400 font-normal"> • {entry.brand}</span>}
                      </h3>
                      <div className="text-xs text-gray-400 mt-1">
                        {entry.quantity * (entry.servings || 1)}{entry.unit} • {Math.round(entry.calories * (entry.servings || 1))} cal • {Math.round(entry.carbs * (entry.servings || 1))}g carbs • {Math.round(entry.protein * (entry.servings || 1))}g protein • {Math.round(entry.fat * (entry.servings || 1))}g fat
                        {entry.fiber && <span> • {Math.round(entry.fiber * (entry.servings || 1))}g fiber</span>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFood(entry.id);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-gray-600 rounded-xl p-1 ml-2"
                      data-testid={`button-delete-${entry.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {getMealEntries('snack').length === 0 && (
                  <div className="text-center text-gray-500 py-4 text-sm">
                    No snacks logged
                  </div>
                )}
                
                {/* Add Food Button */}
                <Button
                  onClick={() => openSearchForMeal('snack')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center"
                  data-testid="button-add-snack"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Food
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Edit Food Modal */}
        {editingFood && (
          <Dialog open={!!editingFood} onOpenChange={() => setEditingFood(null)}>
            <DialogContent className="bg-gray-800 border-gray-600 text-white rounded-2xl max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Food</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Modify the nutritional information for this food item
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                
                <div>
                  <Label htmlFor="editName" className="text-sm text-gray-300">Food Name</Label>
                  <Input
                    id="editName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g., Grilled Chicken Breast"
                    className="bg-gray-700 border-gray-600 text-white rounded-xl"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editCalories" className="text-sm text-gray-300">Calories</Label>
                    <Input
                      id="editCalories"
                      type="number"
                      value={editCalories}
                      onChange={(e) => setEditCalories(e.target.value)}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editCarbs" className="text-sm text-gray-300">Carbs (g)</Label>
                    <Input
                      id="editCarbs"
                      type="number"
                      value={editCarbs}
                      onChange={(e) => setEditCarbs(e.target.value)}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white rounded-xl"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editProtein" className="text-sm text-gray-300">Protein (g)</Label>
                    <Input
                      id="editProtein"
                      type="number"
                      value={editProtein}
                      onChange={(e) => setEditProtein(e.target.value)}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editFat" className="text-sm text-gray-300">Fat (g)</Label>
                    <Input
                      id="editFat"
                      type="number"
                      value={editFat}
                      onChange={(e) => setEditFat(e.target.value)}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white rounded-xl"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-2">
                  <Button 
                    onClick={handleSaveEdit}
                    disabled={!editName.trim() || !editCalories || !editCarbs || !editProtein || !editFat}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 rounded-xl"
                  >
                    <Cancel className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Custom Food Dialog */}
        <Dialog open={customFoodOpen} onOpenChange={setCustomFoodOpen}>
          <DialogContent className="bg-gray-800 border-gray-600 text-white rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom Food</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a new food item to your database with nutritional information
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="custom-name" className="text-white">Food Name *</Label>
                    <Input
                      id="custom-name"
                      value={customFoodData.name}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Homemade Apple Pie"
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-brand" className="text-white">Brand (Optional)</Label>
                    <Input
                      id="custom-brand"
                      value={customFoodData.brand}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="e.g., Mom's Recipe"
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-brand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="custom-quantity" className="text-white">Serving Size *</Label>
                    <Input
                      id="custom-quantity"
                      type="number"
                      step="0.1"
                      value={customFoodData.quantity}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="100"
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-quantity"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-unit" className="text-white">Unit</Label>
                    <Select 
                      value={customFoodData.unit} 
                      onValueChange={(value: FoodUnit) => setCustomFoodData(prev => ({ ...prev, unit: value }))}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white" data-testid="select-custom-unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="g">grams (g)</SelectItem>
                        <SelectItem value="oz">ounces (oz)</SelectItem>
                        <SelectItem value="cup">cups</SelectItem>
                        <SelectItem value="piece">pieces</SelectItem>
                        <SelectItem value="serving">servings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Macronutrients */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Macronutrients (per serving)</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="custom-calories" className="text-white">Calories</Label>
                    <Input
                      id="custom-calories"
                      type="number"
                      step="0.1"
                      min="0"
                      value={customFoodData.calories}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, calories: e.target.value }))}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-calories"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-carbs" className="text-white">Carbs (g)</Label>
                    <Input
                      id="custom-carbs"
                      type="number"
                      step="0.1"
                      min="0"
                      value={customFoodData.carbs}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, carbs: e.target.value }))}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-carbs"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-protein" className="text-white">Protein (g)</Label>
                    <Input
                      id="custom-protein"
                      type="number"
                      step="0.1"
                      min="0"
                      value={customFoodData.protein}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, protein: e.target.value }))}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-protein"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-fat" className="text-white">Fat (g)</Label>
                    <Input
                      id="custom-fat"
                      type="number"
                      step="0.1"
                      min="0"
                      value={customFoodData.fat}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, fat: e.target.value }))}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-fat"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Nutrients */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Additional Nutrients (Optional)</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="custom-fiber" className="text-white">Fiber (g)</Label>
                    <Input
                      id="custom-fiber"
                      type="number"
                      step="0.1"
                      value={customFoodData.fiber}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, fiber: e.target.value }))}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-fiber"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-sugar" className="text-white">Sugar (g)</Label>
                    <Input
                      id="custom-sugar"
                      type="number"
                      step="0.1"
                      value={customFoodData.sugar}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, sugar: e.target.value }))}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-sugar"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-sodium" className="text-white">Sodium (mg)</Label>
                    <Input
                      id="custom-sodium"
                      type="number"
                      step="0.1"
                      value={customFoodData.sodium}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, sodium: e.target.value }))}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-sodium"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-saturated-fat" className="text-white">Saturated Fat (g)</Label>
                    <Input
                      id="custom-saturated-fat"
                      type="number"
                      step="0.1"
                      value={customFoodData.saturatedFat}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, saturatedFat: e.target.value }))}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-saturated-fat"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-cholesterol" className="text-white">Cholesterol (mg)</Label>
                    <Input
                      id="custom-cholesterol"
                      type="number"
                      step="0.1"
                      value={customFoodData.cholesterol}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, cholesterol: e.target.value }))}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-cholesterol"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-potassium" className="text-white">Potassium (mg)</Label>
                    <Input
                      id="custom-potassium"
                      type="number"
                      step="0.1"
                      value={customFoodData.potassium}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, potassium: e.target.value }))}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-potassium"
                    />
                  </div>
                </div>
              </div>

              {/* Vitamins & Minerals */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Vitamins & Minerals (Optional)</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="custom-vitamin-a" className="text-white">Vitamin A (IU)</Label>
                    <Input
                      id="custom-vitamin-a"
                      type="number"
                      step="0.1"
                      value={customFoodData.vitaminA}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, vitaminA: e.target.value }))}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-vitamin-a"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-vitamin-c" className="text-white">Vitamin C (mg)</Label>
                    <Input
                      id="custom-vitamin-c"
                      type="number"
                      step="0.1"
                      value={customFoodData.vitaminC}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, vitaminC: e.target.value }))}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-vitamin-c"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-calcium" className="text-white">Calcium (mg)</Label>
                    <Input
                      id="custom-calcium"
                      type="number"
                      step="0.1"
                      value={customFoodData.calcium}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, calcium: e.target.value }))}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-calcium"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-iron" className="text-white">Iron (mg)</Label>
                    <Input
                      id="custom-iron"
                      type="number"
                      step="0.1"
                      value={customFoodData.iron}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, iron: e.target.value }))}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-iron"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-600">
                <Button
                  onClick={() => {
                    setCustomFoodOpen(false);
                    setEditingEntryId(null);
                  }}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                  data-testid="button-cancel-custom"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCustomFoodSubmit}
                  disabled={!customFoodData.name.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-save-custom"
                >
                  Save Food
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Entry Modal (When adding food from search/recent) */}
        <Dialog open={addEntryOpen} onOpenChange={setAddEntryOpen}>
          <DialogContent className="bg-gray-800 border-gray-600 text-white rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle>Add Entry</DialogTitle>
            </DialogHeader>
            
            {addingFood && (
              <div className="space-y-6">
                {/* Food Name and Brand */}
                <div>
                  <h3 className="text-xl font-semibold text-white">{addingFood.name}</h3>
                  {addingFood.brand && (
                    <p className="text-sm text-gray-400">{addingFood.brand}</p>
                  )}
                </div>

                {/* Serving Size Display */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Serving Size</Label>
                  <div className="bg-gray-700 border border-gray-600 rounded-xl p-3 text-right">
                    <span className="text-blue-400">{addingFood.quantity}{addingFood.unit}</span>
                  </div>
                </div>

                {/* Number of Servings */}
                <div className="space-y-2">
                  <Label htmlFor="add-servings" className="text-gray-300">Number of Servings</Label>
                  <Input
                    id="add-servings"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={addEntryServings}
                    onChange={(e) => setAddEntryServings(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white text-right rounded-xl"
                    data-testid="input-add-servings"
                  />
                </div>

                {/* Meal Selection */}
                <div className="space-y-2">
                  <Label htmlFor="add-meal" className="text-gray-300">Meal</Label>
                  <Select value={addEntryMeal} onValueChange={(value: any) => setAddEntryMeal(value)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white rounded-xl" id="add-meal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nutritional Summary */}
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {Math.round(addingFood.calories * parseFloat(addEntryServings || '1'))}
                      </div>
                      <div className="text-xs text-gray-400">cal</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-blue-400">
                        {Math.round(addingFood.carbs * parseFloat(addEntryServings || '1'))}g
                      </div>
                      <div className="text-xs text-gray-400">Carbs</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-red-400">
                        {Math.round(addingFood.fat * parseFloat(addEntryServings || '1'))}g
                      </div>
                      <div className="text-xs text-gray-400">Fat</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-400">
                        {Math.round(addingFood.protein * parseFloat(addEntryServings || '1'))}g
                      </div>
                      <div className="text-xs text-gray-400">Protein</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-2">
                  <Button
                    onClick={() => setAddEntryOpen(false)}
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitAddEntry}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                    data-testid="button-save-add-entry"
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Entry Modal (Simple modal for adjusting servings and meal) */}
        <Dialog open={editEntryOpen} onOpenChange={setEditEntryOpen}>
          <DialogContent className="bg-gray-800 border-gray-600 text-white rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Entry</DialogTitle>
            </DialogHeader>
            
            {editingEntry && (
              <div className="space-y-6">
                {/* Food Name and Brand */}
                <div>
                  <h3 className="text-xl font-semibold text-white">{editingEntry.name}</h3>
                  {editingEntry.brand && (
                    <p className="text-sm text-gray-400">{editingEntry.brand}</p>
                  )}
                </div>

                {/* Serving Size Display */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Serving Size</Label>
                  <div className="bg-gray-700 border border-gray-600 rounded-xl p-3 text-right">
                    <span className="text-blue-400">{editingEntry.quantity}{editingEntry.unit}</span>
                  </div>
                </div>

                {/* Number of Servings */}
                <div className="space-y-2">
                  <Label htmlFor="edit-servings" className="text-gray-300">Number of Servings</Label>
                  <Input
                    id="edit-servings"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={editEntryServings}
                    onChange={(e) => setEditEntryServings(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white text-right rounded-xl"
                    data-testid="input-edit-servings"
                  />
                </div>

                {/* Meal Selection */}
                <div className="space-y-2">
                  <Label htmlFor="edit-meal" className="text-gray-300">Meal</Label>
                  <Select value={editEntryMeal} onValueChange={(value: any) => setEditEntryMeal(value)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white rounded-xl" id="edit-meal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nutritional Summary */}
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {Math.round(editingEntry.calories * parseFloat(editEntryServings || '1'))}
                      </div>
                      <div className="text-xs text-gray-400">cal</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-blue-400">
                        {Math.round(editingEntry.carbs * parseFloat(editEntryServings || '1'))}g
                      </div>
                      <div className="text-xs text-gray-400">Carbs</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-red-400">
                        {Math.round(editingEntry.fat * parseFloat(editEntryServings || '1'))}g
                      </div>
                      <div className="text-xs text-gray-400">Fat</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-400">
                        {Math.round(editingEntry.protein * parseFloat(editEntryServings || '1'))}g
                      </div>
                      <div className="text-xs text-gray-400">Protein</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-2">
                  <Button
                    onClick={() => setEditEntryOpen(false)}
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEditEntry}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                    data-testid="button-save-edit-entry"
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
      </div>
    </div>
  );
}