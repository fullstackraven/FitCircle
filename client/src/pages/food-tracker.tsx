import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  meal: 'breakfast' | 'lunch' | 'dinner';
  timestamp: string;
}

interface MacroTargets {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

export default function FoodTrackerPage() {
  const [, navigate] = useLocation();
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [macroTargets, setMacroTargets] = useState<MacroTargets>({
    calories: 2000,
    carbs: 250,
    protein: 150,
    fat: 67
  });
  
  // Form states
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner'>('breakfast');
  
  // Collapsible states
  const [breakfastOpen, setBreakfastOpen] = useState(true);
  const [lunchOpen, setLunchOpen] = useState(false);
  const [dinnerOpen, setDinnerOpen] = useState(false);

  // Check if we came from dashboard
  const fromDashboard = new URLSearchParams(window.location.search).get('from') === 'dashboard';
  
  const handleBack = () => {
    if (fromDashboard) {
      navigate('/?dashboard=open');
    } else {
      navigate('/');
    }
  };

  // Load data on component mount
  useEffect(() => {
    // Load today's food entries
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(`fitcircle_food_${today}`);
    if (stored) {
      setFoodEntries(JSON.parse(stored));
    }

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
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`fitcircle_food_${today}`, JSON.stringify(foodEntries));
  }, [foodEntries]);

  const handleAddFood = () => {
    if (!foodName.trim() || !calories || !carbs || !protein || !fat) return;

    const newEntry: FoodEntry = {
      id: Date.now().toString(),
      name: foodName.trim(),
      calories: parseFloat(calories),
      carbs: parseFloat(carbs),
      protein: parseFloat(protein),
      fat: parseFloat(fat),
      meal: selectedMeal,
      timestamp: new Date().toISOString()
    };

    setFoodEntries(prev => [...prev, newEntry]);
    
    // Clear form
    setFoodName('');
    setCalories('');
    setCarbs('');
    setProtein('');
    setFat('');
  };

  const handleDeleteFood = (id: string) => {
    setFoodEntries(prev => prev.filter(entry => entry.id !== id));
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
  const getMealEntries = (meal: 'breakfast' | 'lunch' | 'dinner') => 
    foodEntries.filter(entry => entry.meal === meal);

  const getMealTotals = (meal: 'breakfast' | 'lunch' | 'dinner') => {
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
    <div className="min-h-screen bg-gray-900 text-white pb-32">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-white hover:bg-gray-800 rounded-xl"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Food Tracker</h1>
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
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <div className="text-lg font-bold text-blue-400">
              {Math.round(totals.carbs)}g
            </div>
            <div className="text-xs text-gray-400">
              / {macroTargets.carbs}g
            </div>
            <div className="text-xs text-gray-500 mt-1">Carbs</div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(carbsProgress, 100)}%` }}
              />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <div className="text-lg font-bold text-red-400">
              {Math.round(totals.protein)}g
            </div>
            <div className="text-xs text-gray-400">
              / {macroTargets.protein}g
            </div>
            <div className="text-xs text-gray-500 mt-1">Protein</div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-red-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(proteinProgress, 100)}%` }}
              />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <div className="text-lg font-bold text-yellow-400">
              {Math.round(totals.fat)}g
            </div>
            <div className="text-xs text-gray-400">
              / {macroTargets.fat}g
            </div>
            <div className="text-xs text-gray-500 mt-1">Fat</div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(fatProgress, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Add Food Form */}
        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Food
          </h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="foodName" className="text-sm text-gray-300">Food Name</Label>
              <Input
                id="foodName"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="e.g., Grilled Chicken Breast"
                className="bg-gray-700 border-gray-600 text-white rounded-xl"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calories" className="text-sm text-gray-300">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="0"
                  className="bg-gray-700 border-gray-600 text-white rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="carbs" className="text-sm text-gray-300">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                  className="bg-gray-700 border-gray-600 text-white rounded-xl"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="protein" className="text-sm text-gray-300">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                  className="bg-gray-700 border-gray-600 text-white rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="fat" className="text-sm text-gray-300">Fat (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="0"
                  className="bg-gray-700 border-gray-600 text-white rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="meal" className="text-sm text-gray-300">Meal</Label>
                <Select value={selectedMeal} onValueChange={(value: 'breakfast' | 'lunch' | 'dinner') => setSelectedMeal(value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white rounded-xl">
                    <SelectValue placeholder="Select meal" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="breakfast" className="text-white hover:bg-gray-600">Breakfast</SelectItem>
                    <SelectItem value="lunch" className="text-white hover:bg-gray-600">Lunch</SelectItem>
                    <SelectItem value="dinner" className="text-white hover:bg-gray-600">Dinner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={handleAddFood}
              disabled={!foodName.trim() || !calories || !carbs || !protein || !fat}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl"
            >
              Add Food
            </Button>
          </div>
        </div>

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
                    <div className="flex-1">
                      <h3 className="font-medium text-white text-sm">{entry.name}</h3>
                      <div className="text-xs text-gray-400 mt-1">
                        {entry.calories} cal • {entry.carbs}g carbs • {entry.protein}g protein • {entry.fat}g fat
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFood(entry.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-gray-600 rounded-xl ml-2 p-1"
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
                {getMealEntries('lunch').map((entry) => (
                  <div key={entry.id} className="bg-gray-700 rounded-xl p-3 flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-white text-sm">{entry.name}</h3>
                      <div className="text-xs text-gray-400 mt-1">
                        {entry.calories} cal • {entry.carbs}g carbs • {entry.protein}g protein • {entry.fat}g fat
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFood(entry.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-gray-600 rounded-xl ml-2 p-1"
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
                {getMealEntries('dinner').map((entry) => (
                  <div key={entry.id} className="bg-gray-700 rounded-xl p-3 flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-white text-sm">{entry.name}</h3>
                      <div className="text-xs text-gray-400 mt-1">
                        {entry.calories} cal • {entry.carbs}g carbs • {entry.protein}g protein • {entry.fat}g fat
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFood(entry.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-gray-600 rounded-xl ml-2 p-1"
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
        </div>
      </div>
    </div>
  );
}