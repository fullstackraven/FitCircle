import { readFoodDay, assertLoggableFood } from '@/lib/food-diary';
import { DailyNutritionSummary } from '@/components/nutrition/DailyNutritionSummary';
import { NutritionDetails } from '@/components/nutrition/NutritionDetails';
import { WeeklyNutrition } from '@/components/nutrition/WeeklyNutrition';
import { MealDiary } from '@/components/nutrition/MealDiary';
import { FoodEntryForm } from '@/components/nutrition/FoodEntryForm';
import { draftFromFood, type ProductDraft } from '@/lib/barcode-lookup';
import { BarcodeEntry } from '@/components/nutrition/BarcodeEntry';
import { useFoodDiary } from '@/hooks/use-food-diary';
import { displayTargets,readCalculatorEstimate,consumedServingText,CALCULATOR_TARGETS_CHANGED,type Targets } from '@/lib/nutrition';
import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, ChevronLeft, ChevronRight, Search, Edit2, Save, X as Cancel, Calculator, Database, ScanBarcode, CirclePlus } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getTodayString, getDateString, parseLocalDate, isToday } from '@/lib/date-utils';
import { localFoodService, LocalFoodItem, FoodEntry, FoodUnit } from '@/lib/local-food-service';
import { useToast } from '@/hooks/use-toast';
import FitnessCalculator from '@/pages/fitness-calculator';

// Keep dialogs readable on opening; the user chooses when to show the keyboard.
const focusPanelOnOpen = (event: Event) => {
  event.preventDefault();
  if (event.target instanceof HTMLElement) event.target.focus({preventScroll:true});
};

// Validation helper
const validateNutritionInputs = (calories: string, carbs: string, protein: string, fat: string, quantity: string) => {
  const caloriesNum = Number(calories);
  const carbsNum = Number(carbs);
  const proteinNum = Number(protein);
  const fatNum = Number(fat);
  const quantityNum = Number(quantity);
  
  return {
    isValid: [calories,carbs,protein,fat,quantity].every(value=>value.trim()!=='') && [caloriesNum,carbsNum,proteinNum,fatNum,quantityNum].every(Number.isFinite) &&
             caloriesNum >= 0 && carbsNum >= 0 && proteinNum >= 0 && fatNum >= 0 && quantityNum > 0,
    values: { caloriesNum, carbsNum, proteinNum, fatNum, quantityNum }
  };
};

export default function FoodTrackerPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const diary = useFoodDiary(selectedDate);
  const foodEntries = diary.entries;
  const [calculatorTargets, setCalculatorTargets] = useState<Targets | null>(null);
  const [targetsError, setTargetsError] = useState('');
  const [nutritionView,setNutritionView] = useState<'details'|'week'|null>(null);
  const [barcodeOpen,setBarcodeOpen] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const macroTargets = calculatorTargets ?? displayTargets;
  const reloadTargets = () => {
    try {setCalculatorTargets(readCalculatorEstimate());setTargetsError('');}
    catch {setTargetsError('Calculator targets could not be read. Saved data is unchanged.');}
  };
  useEffect(() => {
    reloadTargets();
    window.addEventListener('storage', reloadTargets);
    window.addEventListener(CALCULATOR_TARGETS_CHANGED, reloadTargets);
    return () => {
      window.removeEventListener('storage', reloadTargets);
      window.removeEventListener(CALCULATOR_TARGETS_CHANGED, reloadTargets);
    };
  }, []);
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
    calories: '',
    carbs: '',
    protein: '',
    fat: '',
    fiber: '',
    sugar: '',
    sodium: '',
    saturatedFat: '',
    potassium: '',
    cholesterol: '',
    vitaminA: '',
    vitaminC: '',
    calcium: '',
    iron: ''
  });
  const [searchResults, setSearchResults] = useState<LocalFoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null); // Track entry being edited
  
  // Add Entry Modal states (when adding from search/recent)
  const [addEntryOpen, setAddEntryOpen] = useState(false);
  const [addingFood, setAddingFood] = useState<LocalFoodItem | null>(null);
  const [scannedDraft, setScannedDraft] = useState<ProductDraft | null>(null);
  const [addEntryMeal, setAddEntryMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  
  // Edit Entry Modal states (when editing logged food in meals)
  const [editEntryOpen, setEditEntryOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [editEntryServings, setEditEntryServings] = useState('1');
  const [editEntryMeal, setEditEntryMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  
  // Calculator modal state
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  const handleBack = () => {
    navigate('/wellness');
  };

  // Date navigation functions
  const goToPreviousDay = () => {
    const currentDate = parseLocalDate(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    setSelectedDate(getDateString(currentDate));
  };

  const goToNextDay = () => {
    const currentDate = parseLocalDate(selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    const nextDay = getDateString(currentDate);
    const today = getTodayString();
    
    // Don't allow navigating beyond today
    if (nextDay <= today) {
      setSelectedDate(nextDay);
    }
  };

  const goToToday = () => {
    setSelectedDate(getTodayString());
  };

  const getDateDisplayText = () => {
    if (isToday(selectedDate)) {
      return 'Today';
    }
    
    const date = parseLocalDate(selectedDate);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  // Load all food history for search functionality
  useEffect(() => {
    const loadAllFoodHistory = () => {
      const allFoods: FoodEntry[] = [];
      const seenFoods = new Set<string>(); // Track unique food names to avoid duplicates
      
      // Get all localStorage keys that start with 'fitcircle_food_'
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && /^fitcircle_food_\d{4}-\d{2}-\d{2}$/.test(key)) {
          let entries: FoodEntry[];
          try {entries = readFoodDay(key.slice('fitcircle_food_'.length)).entries;} catch {continue;}
          
          // Ensure entries is an array before iterating
          if (!Array.isArray(entries)) {
            console.warn(`Invalid data format for key ${key}, skipping`);
            continue;
          }
          
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

  const handleDeleteFood = (id: string) => {
    diary.commit(foodEntries.filter(entry => entry.id !== id));
  };

  // Search functions
  const filteredFoodHistory = allFoodHistory.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Local search with throttling
  const performLocalSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const products = await localFoodService.searchProducts(query, 20);
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
    setEditingEntryId(null);
    setCustomFoodMeal(meal);
    setCustomFoodData({
      name: '',
      brand: '',
      quantity: '100',
      unit: 'g' as FoodUnit,
      calories: '',
      carbs: '',
      protein: '',
      fat: '',
      fiber: '',
      sugar: '',
      sodium: '',
      saturatedFat: '',
      potassium: '',
      cholesterol: '',
      vitaminA: '',
      vitaminC: '',
      calcium: '',
      iron: ''
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

    if (!validateNutritionInputs(customFoodData.calories,customFoodData.carbs,customFoodData.protein,customFoodData.fat,customFoodData.quantity).isValid) {
      toast({title:'Check serving size and all four nutrition values',description:'Enter known values, including explicit zeros.',variant:'destructive'});return;
    }
    // Parse explicitly entered values; the storage validator rejects invalid optional nutrients.

    const parseOrDefault = (value: string) => {
      const parsed = Number(value);
      return parsed;
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
      fiber: customFoodData.fiber.trim() !== '' ? parseOrDefault(customFoodData.fiber) : undefined,
      sugar: customFoodData.sugar.trim() !== '' ? parseOrDefault(customFoodData.sugar) : undefined,
      sodium: customFoodData.sodium.trim() !== '' ? parseOrDefault(customFoodData.sodium) : undefined,
      saturatedFat: customFoodData.saturatedFat.trim() !== '' ? parseOrDefault(customFoodData.saturatedFat) : undefined,
      potassium: customFoodData.potassium.trim() !== '' ? parseOrDefault(customFoodData.potassium) : undefined,
      cholesterol: customFoodData.cholesterol.trim() !== '' ? parseOrDefault(customFoodData.cholesterol) : undefined,
      vitaminA: customFoodData.vitaminA.trim() !== '' ? parseOrDefault(customFoodData.vitaminA) : undefined,
      vitaminC: customFoodData.vitaminC.trim() !== '' ? parseOrDefault(customFoodData.vitaminC) : undefined,
      calcium: customFoodData.calcium.trim() !== '' ? parseOrDefault(customFoodData.calcium) : undefined,
      iron: customFoodData.iron.trim() !== '' ? parseOrDefault(customFoodData.iron) : undefined
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
        if (!editingEntryId) {handleAddFromSearch(result.food);setAddEntryMeal(customFoodMeal);}
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
  const handleSubmitAddEntry = (addingFood: LocalFoodItem, servings: number, meal: FoodEntry['meal']) => {
    try {assertLoggableFood(addingFood);} catch (error) {toast({title:'Check food nutrition',description:error instanceof Error ? error.message : 'Check this food before logging.',variant:'destructive'});return false;}

    if (!Number.isFinite(servings) || servings <= 0) return false;

    // Convert food to entry format with servings
    const newEntry: FoodEntry = {
      ...addingFood,
      id: crypto.randomUUID(),
      servings,
      meal,
      timestamp: new Date().toISOString()
    };

    if (!diary.commit([...foodEntries, newEntry])) return false;

    toast({
      title: "Food Logged!",
      description: `${addingFood.name} has been added to your ${meal}.`
    });

    setAddEntryOpen(false);
    setAddingFood(null);
    setScannedDraft(null);
    return true;
  };

  // Function to open Add Entry modal when clicking + on a food from search/recent
  const handleAddFromSearch = (food: LocalFoodItem) => {
    diary.clearError();
    setAddingFood(food);
    setScannedDraft(null);
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
    diary.clearError();
    setEditingEntry(entry);
    setEditEntryServings((entry.servings || 1).toString()); // Show current servings value
    setEditEntryMeal(entry.meal);
    setEditEntryOpen(true);
  };

  // Function to save the edited entry (servings/meal changes)
  const handleSaveEditEntry = () => {
    if (!editingEntry) return;

    const newServings = Number(editEntryServings);
    if (!Number.isFinite(newServings) || newServings <= 0) {toast({title:'Enter a positive serving count',variant:'destructive'});return;}
    
    // ONLY update servings and meal - base nutritional values stay unchanged
    const updatedEntry: FoodEntry = {
      ...editingEntry,
      servings: newServings,
      meal: editEntryMeal
    };

    const updatedEntries = foodEntries.map(entry => 
      entry.id === editingEntry.id ? updatedEntry : entry
    );
    if (!diary.commit(updatedEntries)) return;

    toast({
      title: "Entry Updated!",
      description: `${editingEntry.name} has been updated.`
    });

    setEditEntryOpen(false);
    setEditingEntry(null);
  };

  return (
    <div className="fitcircle-page">
      <div className="fitcircle-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="text-slate-400 hover:text-white transition-colors min-h-11 min-w-11 flex items-center justify-center"
            aria-label="Back to Logs"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="fitcircle-page-title">Food Tracker</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/food-database')}
              className="text-slate-400 hover:text-white transition-colors min-h-11 min-w-11 flex items-center justify-center"
              aria-label="Food Database"
              data-testid="button-database"
            >
              <Database className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCalculatorOpen(true)}
              className="text-slate-400 hover:text-white transition-colors min-h-11 min-w-11 flex items-center justify-center"
              aria-label="Fitness Calculator"
              data-testid="button-calculator"
            >
              <Calculator className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={goToPreviousDay}
            className="text-slate-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-slate-800"
            data-testid="button-previous-day"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div 
            className="min-w-[140px] text-center cursor-pointer"
            onClick={goToToday}
            data-testid="button-date-display"
          >
            <div className="text-lg font-semibold text-white">
              {getDateDisplayText()}
            </div>
          </div>
          
          <button
            onClick={goToNextDay}
            disabled={isToday(selectedDate)}
            className={`transition-colors p-2 rounded-xl ${
              isToday(selectedDate) 
                ? 'text-slate-600 cursor-not-allowed' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            data-testid="button-next-day"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <p className="text-sm text-slate-400 mb-4">Daily nutrition overview</p>
        {(diary.error || diary.saveError) && <div role="alert" className="rounded-xl border border-amber-500/40 p-3 text-sm text-amber-200 mb-3">{diary.error || diary.saveError}<Button variant="ghost" onClick={diary.retry}>Retry Loading Day</Button></div>}
        {targetsError && <div role="alert" className="text-sm text-amber-200 mb-3">{targetsError}<Button variant="ghost" onClick={reloadTargets}>Retry Targets</Button></div>}
        {diary.ready && <DailyNutritionSummary entries={foodEntries} targets={macroTargets} confirmed={!!calculatorTargets}/>}
        <div className="flex flex-wrap gap-2 my-4">
          <Button variant="ghost" disabled={!diary.ready} onClick={()=>setNutritionView('details')}>Nutrition Details</Button>
          <Button variant="ghost" onClick={()=>setNutritionView('week')}>Weekly Overview</Button>
        </div>
        <Dialog open={nutritionView!==null} onOpenChange={open=>{if(!open)setNutritionView(null);}}>
          <DialogContent onOpenAutoFocus={focusPanelOnOpen} className="max-w-md bg-slate-900 border-slate-700">
            <DialogHeader><DialogTitle>{nutritionView==='details'?'Nutrition Details':'Weekly Nutrition'}</DialogTitle><DialogDescription className="sr-only">{getDateDisplayText()}</DialogDescription></DialogHeader>

            {nutritionView==='details'&&<NutritionDetails entries={foodEntries} targets={calculatorTargets ?? undefined}/>}
            {nutritionView==='week'&&<WeeklyNutrition date={selectedDate} targets={calculatorTargets ?? undefined}/>}
          </DialogContent>
        </Dialog>
        <Dialog open={barcodeOpen} onOpenChange={setBarcodeOpen}>
          <DialogContent onOpenAutoFocus={focusPanelOnOpen} className="max-w-lg bg-slate-900 border-slate-700">
            <DialogHeader><DialogTitle>Scan Barcode</DialogTitle><DialogDescription className="sr-only">Scan a barcode or enter it manually.</DialogDescription></DialogHeader>
            {barcodeOpen&&<BarcodeEntry onFound={result=>{diary.clearError();setAddingFood(result.local);setScannedDraft(result.draft);setAddEntryMeal(searchMeal);setBarcodeOpen(false);setAddEntryOpen(true);}}/>}
          </DialogContent>
        </Dialog>

        {/* Search Dialog - triggered by meal 'Add food' buttons */}
        <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
          <DialogContent onOpenAutoFocus={focusPanelOnOpen} className="bg-slate-900 border-slate-700 text-white rounded-3xl max-w-lg">
            <DialogHeader className="items-start">
              <DialogTitle className="text-2xl font-bold text-left">
                Add Food
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              
              {/* Search Bar */}
              <label htmlFor="food-search" className="block text-sm text-slate-400">Search your food database</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="food-search"
                  aria-label="Search foods"
                  className="h-14 bg-slate-800 border-slate-700 text-white rounded-2xl pl-10 pr-10"
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

              <div className="grid grid-cols-2 gap-3">
                <button type="button" aria-label="Scan Barcode" onClick={()=>{setSearchOpen(false);setBarcodeOpen(true);}} className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-3xl border border-green-400/30 bg-green-400/15 p-4 text-center hover:bg-green-400/20">
                  <ScanBarcode className="h-7 w-7 text-green-400"/><span className="font-semibold text-white">Scan Barcode</span><span className="text-xs text-slate-400">Identify packaged food</span>
                </button>
                <button type="button" onClick={() => openCustomFoodForMeal(searchMeal)} data-testid="button-create-custom-food" aria-label="Create Custom Food" className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-3xl border border-slate-700 bg-slate-800 p-4 text-center hover:bg-slate-700">
                  <CirclePlus className="h-7 w-7 text-blue-400"/><span className="font-semibold text-white">Custom Food</span><span className="text-xs text-slate-400">Enter nutrition manually</span>
                </button>
              </div>
              <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">{searchQuery ? 'Search Results' : 'Recent Foods'}</h3>{!searchQuery && filteredFoodHistory.length > 10 && <Button variant="ghost" className="text-green-400" onClick={() => setShowAllRecent(!showAllRecent)}>{showAllRecent ? 'Show less' : 'View all'}</Button>}</div>
              {/* Food List */}
              <div className="min-w-0 overflow-y-auto pr-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                {searchQuery ? (
                  // Search Results
                  searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((food) => (
                        <div key={food.id} className="glass-panel bg-slate-800 border border-slate-700 rounded-xl p-4 transition-colors" data-testid={`row-food-${food.id}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-white mb-1">
                                {food.name}
                              </h3>
                              {food.brand && (
                                <p className="text-sm text-slate-400 mb-2">
                                  {food.brand}
                                </p>
                              )}
                              
                              {/* Macros */}
                              <div className="flex flex-wrap gap-2 text-xs mb-2">
                                <div className="px-2 py-1 bg-slate-700 rounded-xl">
                                  <span className="text-slate-400">Cal:</span> <span className="text-white font-medium">{food.calories}</span>
                                </div>
                                <div className="px-2 py-1 bg-slate-700 rounded-xl">
                                  <span className="text-slate-400">C:</span> <span className="text-white font-medium">{food.carbs}g</span>
                                </div>
                                <div className="px-2 py-1 bg-slate-700 rounded-xl">
                                  <span className="text-slate-400">P:</span> <span className="text-white font-medium">{food.protein}g</span>
                                </div>
                                <div className="px-2 py-1 bg-slate-700 rounded-xl">
                                  <span className="text-slate-400">F:</span> <span className="text-white font-medium">{food.fat}g</span>
                                </div>
                              </div>
                              
                              {/* Serving Size */}
                              <div className="text-xs text-slate-500">
                                Per {food.quantity}{food.unit}
                              </div>
                            </div>
                            
                            {diary.saveError && <p role="alert" className="text-sm text-red-400">{diary.saveError}</p>}
                {/* Action Buttons */}
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditFoodFromSearch(food)}
                                className="text-slate-400 hover:text-slate-200 hover:bg-slate-600"
                                data-testid={`button-edit-${food.id}`}
                                title="Edit food"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAddFromSearch(food)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-950"
                                data-testid={`button-add-${food.id}`}
                                title="Add to meal"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteFoodFromDatabase(food)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-950"
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
                      {filteredFoodHistory.slice(0, showAllRecent ? undefined : 10).map((food) => (
                        <div key={food.id} className="glass-panel bg-slate-800 border border-slate-700 rounded-xl p-4 transition-colors" data-testid={`row-food-${food.id}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-white mb-1">
                                {food.name}
                              </h3>
                              {food.brand && (
                                <p className="text-sm text-slate-400 mb-2">
                                  {food.brand}
                                </p>
                              )}
                              
                              {/* Macros */}
                              <div className="flex flex-wrap gap-2 text-xs mb-2">
                                <div className="px-2 py-1 bg-slate-700 rounded-xl">
                                  <span className="text-slate-400">Cal:</span> <span className="text-white font-medium">{food.calories}</span>
                                </div>
                                <div className="px-2 py-1 bg-slate-700 rounded-xl">
                                  <span className="text-slate-400">C:</span> <span className="text-white font-medium">{food.carbs}g</span>
                                </div>
                                <div className="px-2 py-1 bg-slate-700 rounded-xl">
                                  <span className="text-slate-400">P:</span> <span className="text-white font-medium">{food.protein}g</span>
                                </div>
                                <div className="px-2 py-1 bg-slate-700 rounded-xl">
                                  <span className="text-slate-400">F:</span> <span className="text-white font-medium">{food.fat}g</span>
                                </div>
                              </div>
                              
                              {/* Serving Size */}
                              <div className="text-xs text-slate-500">
                                Per {food.quantity}{food.unit}
                              </div>
                            </div>
                            
                            {/* Add Button */}
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAddFromSearch(food)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-950"
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

        <div className="flex items-center justify-between mb-3"><h2 className="text-lg font-semibold text-white">{isToday(selectedDate)?"Today's Meals":'Meals'}</h2></div>
        <MealDiary entries={foodEntries} disabled={!diary.ready} onAdd={openSearchForMeal} onEdit={handleEditFoodEntry} onDelete={handleDeleteFood}/>

        {/* Custom Food Dialog */}
        <Dialog open={customFoodOpen} onOpenChange={setCustomFoodOpen}>
          <DialogContent onOpenAutoFocus={focusPanelOnOpen} className="bg-gray-800 border-gray-600 text-white rounded-2xl max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom Food</DialogTitle>
              <DialogDescription className="sr-only">Enter food and serving details.</DialogDescription>
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
                      type="text"
                      inputMode="decimal"
                      value={customFoodData.quantity}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, quantity: e.target.value }))}
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
                        <SelectItem value="ml">milliliters (ml)</SelectItem>
                        <SelectItem value="slice">slices</SelectItem>
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
                      type="text"
                      inputMode="decimal"
                      value={customFoodData.calories}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, calories: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-calories"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-carbs" className="text-white">Carbs (g)</Label>
                    <Input
                      id="custom-carbs"
                      type="text"
                      inputMode="decimal"
                      value={customFoodData.carbs}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, carbs: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-carbs"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-protein" className="text-white">Protein (g)</Label>
                    <Input
                      id="custom-protein"
                      type="text"
                      inputMode="decimal"
                      value={customFoodData.protein}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, protein: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-protein"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-fat" className="text-white">Fat (g)</Label>
                    <Input
                      id="custom-fat"
                      type="text"
                      inputMode="decimal"
                      value={customFoodData.fat}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, fat: e.target.value }))}
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
                      type="text"
                      inputMode="decimal"
                      value={customFoodData.fiber}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, fiber: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-fiber"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-sugar" className="text-white">Sugar (g)</Label>
                    <Input
                      id="custom-sugar"
                      type="text"
                      inputMode="decimal"
                      value={customFoodData.sugar}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, sugar: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-sugar"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-sodium" className="text-white">Sodium (mg)</Label>
                    <Input
                      id="custom-sodium"
                      type="text"
                      inputMode="decimal"
                      value={customFoodData.sodium}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, sodium: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-sodium"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-saturated-fat" className="text-white">Saturated Fat (g)</Label>
                    <Input
                      id="custom-saturated-fat"
                      type="text"
                      inputMode="decimal"
                      value={customFoodData.saturatedFat}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, saturatedFat: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-saturated-fat"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-cholesterol" className="text-white">Cholesterol (mg)</Label>
                    <Input
                      id="custom-cholesterol"
                      type="text"
                      inputMode="decimal"
                      value={customFoodData.cholesterol}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, cholesterol: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-cholesterol"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-potassium" className="text-white">Potassium (mg)</Label>
                    <Input
                      id="custom-potassium"
                      type="text"
                      inputMode="decimal"
                      value={customFoodData.potassium}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, potassium: e.target.value }))}
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
                      type="text"
                      inputMode="decimal"
                      value={customFoodData.vitaminA}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, vitaminA: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-vitamin-a"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-vitamin-c" className="text-white">Vitamin C (mg)</Label>
                    <Input
                      id="custom-vitamin-c"
                      type="text"
                      inputMode="decimal"
                      value={customFoodData.vitaminC}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, vitaminC: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-vitamin-c"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-calcium" className="text-white">Calcium (mg)</Label>
                    <Input
                      id="custom-calcium"
                      type="text"
                      inputMode="decimal"
                      value={customFoodData.calcium}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, calcium: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-custom-calcium"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-iron" className="text-white">Iron (mg)</Label>
                    <Input
                      id="custom-iron"
                      type="text"
                      inputMode="decimal"
                      value={customFoodData.iron}
                      onChange={(e) => setCustomFoodData(prev => ({ ...prev, iron: e.target.value }))}
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
          <DialogContent onOpenAutoFocus={focusPanelOnOpen} className="bg-slate-900 border-slate-700 text-white rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle>Add Entry</DialogTitle>
            </DialogHeader>
            
            {addEntryOpen && (scannedDraft || addingFood) && <FoodEntryForm
              initial={scannedDraft ?? draftFromFood(addingFood!)} local={addingFood} scanned={!!scannedDraft}
              initialMeal={addEntryMeal} saveError={diary.saveError} onAdd={handleSubmitAddEntry} onCancel={() => setAddEntryOpen(false)}
            />}

          </DialogContent>
        </Dialog>

        {/* Edit Entry Modal (Simple modal for adjusting servings and meal) */}
        <Dialog open={editEntryOpen} onOpenChange={setEditEntryOpen}>
          <DialogContent onOpenAutoFocus={focusPanelOnOpen} className="bg-gray-800 border-gray-600 text-white rounded-2xl max-w-md">
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
                  <Label className="text-gray-300">Base serving (product label)</Label>
                  <div className="bg-gray-700 border border-gray-600 rounded-xl p-3 text-right">
                    <span className="text-blue-400">{editingEntry.quantity}{editingEntry.unit}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-300">2. Choose how much you ate. This multiplies the totals below and does not edit the saved product’s nutrition basis.</p>
                {/* Number of Servings */}
                <div className="space-y-2">
                  <Label htmlFor="edit-servings" className="text-gray-300">Servings eaten (multiplier)</Label>
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

                <p className="text-sm tabular-nums text-green-400">{consumedServingText(editingEntry.quantity, editingEntry.unit, editEntryServings)}</p>
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
                      <div className="type-metric text-2xl font-bold text-white">
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

                {diary.saveError && <p role="alert" className="text-sm text-red-400">{diary.saveError}</p>}
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

        {/* Fitness Calculator Modal */}
        <Dialog open={calculatorOpen} onOpenChange={setCalculatorOpen}>
          <DialogContent onOpenAutoFocus={focusPanelOnOpen} className="max-w-4xl overflow-y-auto bg-slate-900 border-slate-700">
            <DialogHeader className="sm:text-center">
              <DialogTitle className="fitcircle-page-title">Fitness Calculator</DialogTitle>
            </DialogHeader>
            <FitnessCalculator embedded />
          </DialogContent>
        </Dialog>
        
      </div>
    </div>
  );
}