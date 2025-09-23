import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Search, X, Edit2, Save, X as Cancel, ScanLine } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { getTodayString } from '@/lib/date-utils';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';
import { foodApiService } from '@/lib/food-api';
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
  const [apiSearchResults, setApiSearchResults] = useState<FoodEntry[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  
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

  // Serving size form states
  const [servingSizeOpen, setServingSizeOpen] = useState(false);
  const [selectedFoodForServing, setSelectedFoodForServing] = useState<FoodEntry | null>(null);
  const [servingQuantity, setServingQuantity] = useState('1');
  const [servingUnit, setServingUnit] = useState<FoodUnit>('serving');

  // Check if we came from dashboard
  const fromDashboard = new URLSearchParams(window.location.search).get('from') === 'dashboard';
  
  const handleBack = () => {
    if (fromDashboard) {
      sessionStorage.setItem('fitcircle_dashboard_open', 'true');
      navigate('/');
    } else {
      navigate('/');
    }
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
  
  // API search with throttling
  const performApiSearch = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setApiSearchResults([]);
      return;
    }
    
    setIsSearchingApi(true);
    try {
      const products = await foodApiService.searchProducts(query, 8);
      const foodEntries = products.map(product => 
        foodApiService.convertToFoodEntry(product, searchMeal)
      );
      setApiSearchResults(foodEntries);
    } catch (error) {
      console.error('API search failed:', error);
      setApiSearchResults([]);
    } finally {
      setIsSearchingApi(false);
    }
  };
  
  // Throttled API search (now always searches API when query exists)
  useEffect(() => {
    if (searchQuery) {
      const timeoutId = setTimeout(() => {
        performApiSearch(searchQuery);
      }, 300); // 300ms delay to avoid too many API calls
      
      return () => clearTimeout(timeoutId);
    } else {
      setApiSearchResults([]);
    }
  }, [searchQuery, searchMeal]);
  
  // Function to open search for specific meal
  const openSearchForMeal = (meal: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setSearchMeal(meal);
    setSearchQuery('');
    setApiSearchResults([]);
    setSearchOpen(true);
  };

  // Function to open serving size form
  const handleAddFromSearch = (food: FoodEntry) => {
    setSelectedFoodForServing(food);
    setServingQuantity('1');
    setServingUnit(food.unit || 'serving');
    setServingSizeOpen(true);
  };

  // Function to add food with confirmed serving size
  const handleConfirmServingSize = async () => {
    if (!selectedFoodForServing) return;
    
    try {
      // Calculate nutritional values based on serving size
      const multiplier = parseFloat(servingQuantity) || 1;
      
      const newFood: FoodEntry = {
        ...selectedFoodForServing,
        id: Date.now().toString(),
        meal: searchMeal,
        timestamp: new Date().toISOString(),
        quantity: parseFloat(servingQuantity),
        unit: servingUnit,
        calories: Math.round(selectedFoodForServing.calories * multiplier),
        carbs: Math.round(selectedFoodForServing.carbs * multiplier * 10) / 10,
        protein: Math.round(selectedFoodForServing.protein * multiplier * 10) / 10,
        fat: Math.round(selectedFoodForServing.fat * multiplier * 10) / 10,
        fiber: selectedFoodForServing.fiber ? Math.round(selectedFoodForServing.fiber * multiplier * 10) / 10 : undefined,
        sugar: selectedFoodForServing.sugar ? Math.round(selectedFoodForServing.sugar * multiplier * 10) / 10 : undefined,
        sodium: selectedFoodForServing.sodium ? Math.round(selectedFoodForServing.sodium * multiplier) : undefined,
        saturatedFat: selectedFoodForServing.saturatedFat ? Math.round(selectedFoodForServing.saturatedFat * multiplier * 10) / 10 : undefined,
      };
      
      setFoodEntries(prev => [...prev, newFood]);
      
      // Close modals
      setServingSizeOpen(false);
      setSearchOpen(false);
      setSearchQuery('');
      setSelectedFoodForServing(null);
      
      toast({
        title: "Food Added",
        description: `${selectedFoodForServing.name} (${servingQuantity} ${servingUnit}) added to ${searchMeal}`,
      });
    } catch (error) {
      console.error('Error adding food with serving size:', error);
      toast({
        title: "Error",
        description: "Failed to add food. Please try again.",
        variant: "destructive",
      });
    }
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
      calories: acc.calories + entry.calories,
      carbs: acc.carbs + entry.carbs,
      protein: acc.protein + entry.protein,
      fat: acc.fat + entry.fat
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
        calories: acc.calories + entry.calories,
        carbs: acc.carbs + entry.carbs,
        protein: acc.protein + entry.protein,
        fat: acc.fat + entry.fat
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
            className="fitcircle-back-button"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="fitcircle-page-title">Food Tracker</h1>
          <div className="w-16" />
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
          <DialogContent className="bg-gray-800 border-gray-600 text-white rounded-xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                Add to {searchMeal.charAt(0).toUpperCase() + searchMeal.slice(1)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => alert('Barcode scanner functionality coming soon!')}
                  className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl"
                  data-testid="button-scan"
                  title="Scan Barcode"
                >
                  <ScanLine className="h-5 w-5" />
                </Button>
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
                {isSearchingApi && (
                  <div className="absolute inset-x-0 top-full mt-1 text-center">
                    <div className="text-xs text-gray-400">Searching...</div>
                  </div>
                )}
              </div>
                  
              
              {/* Food List */}
              <div className="max-h-80 overflow-y-auto">
                {searchQuery ? (
                  // Search Results
                  apiSearchResults.length > 0 ? (
                    <div className="space-y-2">
                      {apiSearchResults.map((food) => (
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddFromSearch(food)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded-full w-8 h-8 p-0 ml-3 flex-shrink-0"
                              data-testid={`button-add-${food.id}`}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !isSearchingApi ? (
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddFromSearch(food)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded-full w-8 h-8 p-0 ml-3 flex-shrink-0"
                              data-testid={`button-add-${food.id}`}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
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
                {/* Add Food Button */}
                <Button
                  onClick={() => openSearchForMeal('breakfast')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center"
                  data-testid="button-add-breakfast"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Food
                </Button>
                
                {getMealEntries('breakfast').map((entry) => (
                  <div key={entry.id} className="bg-gray-700 rounded-xl p-3 flex justify-between items-start hover:bg-gray-600 transition-colors cursor-pointer">
                    <div 
                      className="flex-1"
                      onClick={() => {
                        setSelectedFoodForServing(entry);
                        setServingQuantity(entry.quantity.toString());
                        setServingUnit(entry.unit);
                        setServingSizeOpen(true);
                      }}
                      data-testid={`food-item-${entry.id}`}
                    >
                      <h3 className="font-medium text-white text-sm">
                        {entry.name}
                        {entry.brand && <span className="text-gray-400 font-normal"> • {entry.brand}</span>}
                      </h3>
                      <div className="text-xs text-gray-400 mt-1">
                        {entry.quantity}{entry.unit} • {entry.calories} cal • {entry.carbs}g carbs • {entry.protein}g protein • {entry.fat}g fat
                        {entry.fiber && <span> • {entry.fiber}g fiber</span>}
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
                {/* Add Food Button */}
                <Button
                  onClick={() => openSearchForMeal('lunch')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center"
                  data-testid="button-add-lunch"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Food
                </Button>
                
                {getMealEntries('lunch').map((entry) => (
                  <div key={entry.id} className="bg-gray-700 rounded-xl p-3 flex justify-between items-start hover:bg-gray-600 transition-colors cursor-pointer">
                    <div 
                      className="flex-1"
                      onClick={() => {
                        setSelectedFoodForServing(entry);
                        setServingQuantity(entry.quantity.toString());
                        setServingUnit(entry.unit);
                        setServingSizeOpen(true);
                      }}
                      data-testid={`food-item-${entry.id}`}
                    >
                      <h3 className="font-medium text-white text-sm">
                        {entry.name}
                        {entry.brand && <span className="text-gray-400 font-normal"> • {entry.brand}</span>}
                      </h3>
                      <div className="text-xs text-gray-400 mt-1">
                        {entry.quantity}{entry.unit} • {entry.calories} cal • {entry.carbs}g carbs • {entry.protein}g protein • {entry.fat}g fat
                        {entry.fiber && <span> • {entry.fiber}g fiber</span>}
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
                {/* Add Food Button */}
                <Button
                  onClick={() => openSearchForMeal('dinner')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center"
                  data-testid="button-add-dinner"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Food
                </Button>
                
                {getMealEntries('dinner').map((entry) => (
                  <div key={entry.id} className="bg-gray-700 rounded-xl p-3 flex justify-between items-start hover:bg-gray-600 transition-colors cursor-pointer">
                    <div 
                      className="flex-1"
                      onClick={() => {
                        setSelectedFoodForServing(entry);
                        setServingQuantity(entry.quantity.toString());
                        setServingUnit(entry.unit);
                        setServingSizeOpen(true);
                      }}
                      data-testid={`food-item-${entry.id}`}
                    >
                      <h3 className="font-medium text-white text-sm">
                        {entry.name}
                        {entry.brand && <span className="text-gray-400 font-normal"> • {entry.brand}</span>}
                      </h3>
                      <div className="text-xs text-gray-400 mt-1">
                        {entry.quantity}{entry.unit} • {entry.calories} cal • {entry.carbs}g carbs • {entry.protein}g protein • {entry.fat}g fat
                        {entry.fiber && <span> • {entry.fiber}g fiber</span>}
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
                {/* Add Food Button */}
                <Button
                  onClick={() => openSearchForMeal('snack')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center"
                  data-testid="button-add-snack"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Food
                </Button>
                
                {getMealEntries('snack').map((entry) => (
                  <div key={entry.id} className="bg-gray-700 rounded-xl p-3 flex justify-between items-start hover:bg-gray-600 transition-colors cursor-pointer">
                    <div 
                      className="flex-1"
                      onClick={() => {
                        setSelectedFoodForServing(entry);
                        setServingQuantity(entry.quantity.toString());
                        setServingUnit(entry.unit);
                        setServingSizeOpen(true);
                      }}
                      data-testid={`food-item-${entry.id}`}
                    >
                      <h3 className="font-medium text-white text-sm">
                        {entry.name}
                        {entry.brand && <span className="text-gray-400 font-normal"> • {entry.brand}</span>}
                      </h3>
                      <div className="text-xs text-gray-400 mt-1">
                        {entry.quantity}{entry.unit} • {entry.calories} cal • {entry.carbs}g carbs • {entry.protein}g protein • {entry.fat}g fat
                        {entry.fiber && <span> • {entry.fiber}g fiber</span>}
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
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Serving Size Modal */}
        <Dialog open={servingSizeOpen} onOpenChange={setServingSizeOpen}>
          <DialogContent className="bg-gray-800 border-gray-600 text-white rounded-xl max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                Confirm Serving Size
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => alert('Barcode scanner functionality coming soon!')}
                  className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl"
                  data-testid="button-scan-barcode-serving"
                  title="Scan Barcode"
                >
                  <ScanLine className="h-5 w-5" />
                </Button>
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Adjust the serving size for {selectedFoodForServing?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              
              {/* Food Info Display */}
              {selectedFoodForServing && (
                <div className="bg-gray-700 rounded-xl p-3">
                  <h4 className="font-medium text-white text-sm">
                    {selectedFoodForServing.name}
                    {selectedFoodForServing.brand && <span className="text-gray-400 font-normal"> • {selectedFoodForServing.brand}</span>}
                  </h4>
                  <div className="text-xs text-gray-400 mt-1">
                    Per {selectedFoodForServing.quantity}{selectedFoodForServing.unit}: {selectedFoodForServing.calories} cal • {selectedFoodForServing.carbs}g carbs • {selectedFoodForServing.protein}g protein • {selectedFoodForServing.fat}g fat
                  </div>
                </div>
              )}
              
              {/* Serving Size Input */}
              <div className="bg-blue-900/20 border border-blue-700/50 p-4 rounded-xl">
                <Label className="text-sm text-blue-300 font-medium">🥄 Your Serving Size</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="servingQuantity" className="text-xs text-gray-400">Quantity</Label>
                    <Input
                      id="servingQuantity"
                      type="number"
                      value={servingQuantity}
                      onChange={(e) => setServingQuantity(e.target.value)}
                      placeholder="1"
                      className="bg-gray-700 border-gray-600 text-white rounded-xl"
                      data-testid="input-serving-quantity"
                    />
                  </div>
                  <div>
                    <Label htmlFor="servingUnit" className="text-xs text-gray-400">Unit</Label>
                    <Select value={servingUnit} onValueChange={(value) => setServingUnit(value as FoodUnit)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white rounded-xl" data-testid="select-serving-unit">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="g" className="text-white hover:bg-gray-600">grams (g)</SelectItem>
                        <SelectItem value="oz" className="text-white hover:bg-gray-600">ounces (oz)</SelectItem>
                        <SelectItem value="cup" className="text-white hover:bg-gray-600">cups</SelectItem>
                        <SelectItem value="piece" className="text-white hover:bg-gray-600">pieces</SelectItem>
                        <SelectItem value="serving" className="text-white hover:bg-gray-600">servings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Calculated Nutrition Preview */}
              {selectedFoodForServing && servingQuantity && (
                <div className="bg-gray-700/50 rounded-xl p-3">
                  <h5 className="text-sm font-medium text-gray-300 mb-2">📊 Nutrition for {servingQuantity} {servingUnit}:</h5>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>Calories: {Math.round(selectedFoodForServing.calories * (parseFloat(servingQuantity) || 1))}</div>
                    <div>Carbs: {Math.round(selectedFoodForServing.carbs * (parseFloat(servingQuantity) || 1) * 10) / 10}g</div>
                    <div>Protein: {Math.round(selectedFoodForServing.protein * (parseFloat(servingQuantity) || 1) * 10) / 10}g</div>
                    <div>Fat: {Math.round(selectedFoodForServing.fat * (parseFloat(servingQuantity) || 1) * 10) / 10}g</div>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 pt-2">
                <Button 
                  onClick={handleConfirmServingSize}
                  disabled={!servingQuantity || parseFloat(servingQuantity) <= 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                  data-testid="button-confirm-serving"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to {searchMeal.charAt(0).toUpperCase() + searchMeal.slice(1)}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setServingSizeOpen(false)}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 rounded-xl"
                  data-testid="button-cancel-serving"
                >
                  <Cancel className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Food Modal */}
        {editingFood && (
          <Dialog open={!!editingFood} onOpenChange={() => setEditingFood(null)}>
            <DialogContent className="bg-gray-800 border-gray-600 text-white rounded-xl max-w-md">
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
      </div>
    </div>
  );
}