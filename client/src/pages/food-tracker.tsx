import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
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

    // Load macro targets from fitness calculator - using EXACT same logic
    const loadMacroTargets = () => {
      // Load user data exactly like fitness calculator
      const profileData = JSON.parse(localStorage.getItem('fitcircle_profile') || '{}');
      const measurementData = JSON.parse(localStorage.getItem('fitcircle_measurements_history') || '{}');
      
      let height = 0;
      let weight = 0;
      
      // Get latest height and weight from measurements using EXACT same structure as fitness calculator
      if (measurementData.height && measurementData.height.length > 0) {
        const latestHeight = measurementData.height[measurementData.height.length - 1];
        height = latestHeight.value;
      }
      if (measurementData.weight && measurementData.weight.length > 0) {
        const latestWeight = measurementData.weight[measurementData.weight.length - 1];
        weight = latestWeight.value;
      }

      // Use same defaults as fitness calculator
      height = height || 70; // default 5'10"
      weight = weight || 170; // default 170 lbs
      const age = profileData.age || 25;
      const gender = profileData.gender || 'male';
      
      // Calculate BMR using EXACT same formula as fitness calculator
      let bmr;
      if (gender === 'male') {
        bmr = 88.362 + (13.397 * (weight / 2.205)) + (4.799 * (height * 2.54)) - (5.677 * age);
      } else {
        bmr = 447.593 + (9.247 * (weight / 2.205)) + (3.098 * (height * 2.54)) - (4.330 * age);
      }
      
      // Activity multipliers - EXACT same as fitness calculator
      const activityLevel = localStorage.getItem('fitness_calc_activity_level') || 'moderate';
      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
      };
      
      const tdee = bmr * (activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.55);
      
      // Goal adjustment - EXACT same as fitness calculator
      const goalType = localStorage.getItem('fitness_calc_goal_type') || 'maintain';
      const goalRate = localStorage.getItem('fitness_calc_goal_rate') || '1';
      
      let dailyCalories = tdee;
      if (goalType === 'lose') {
        dailyCalories = tdee - (parseFloat(goalRate) * 500);
      } else if (goalType === 'gain') {
        dailyCalories = tdee + (parseFloat(goalRate) * 500);
      }
      
      // Macro calculation - EXACT same as fitness calculator
      const macroStyle = localStorage.getItem('fitness_calc_macro_style') || 'standard';
      const customCarbs = localStorage.getItem('fitness_calc_custom_carbs') || '40';
      const customProtein = localStorage.getItem('fitness_calc_custom_protein') || '30';
      const customFat = localStorage.getItem('fitness_calc_custom_fat') || '30';
      
      let carbsPercent, proteinPercent, fatPercent;
      
      if (macroStyle === 'custom') {
        carbsPercent = parseFloat(customCarbs);
        proteinPercent = parseFloat(customProtein);
        fatPercent = parseFloat(customFat);
      } else {
        const macroPresets = {
          standard: { carbs: 45, protein: 25, fat: 30 },
          keto: { carbs: 5, protein: 25, fat: 70 },
          low_carb: { carbs: 20, protein: 35, fat: 45 },
          high_protein: { carbs: 30, protein: 40, fat: 30 },
          mediterranean: { carbs: 45, protein: 20, fat: 35 },
          paleo: { carbs: 25, protein: 30, fat: 45 }
        };
        
        const preset = macroPresets[macroStyle as keyof typeof macroPresets] || macroPresets.standard;
        carbsPercent = preset.carbs;
        proteinPercent = preset.protein;
        fatPercent = preset.fat;
      }
      
      // Calculate macro grams - EXACT same as fitness calculator
      const carbsGrams = Math.round((dailyCalories * carbsPercent / 100) / 4);
      const proteinGrams = Math.round((dailyCalories * proteinPercent / 100) / 4);
      const fatGrams = Math.round((dailyCalories * fatPercent / 100) / 9);

      setMacroTargets({
        calories: Math.round(dailyCalories),
        carbs: carbsGrams,
        protein: proteinGrams,
        fat: fatGrams
      });
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
    <div className="min-h-screen bg-gray-900 text-white">
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

        {/* Food Entries List */}
        {foodEntries.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Today's Foods</h2>
            {foodEntries.map((entry) => (
              <div key={entry.id} className="bg-gray-800 rounded-xl p-4 flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-white">{entry.name}</h3>
                  <div className="text-sm text-gray-400 mt-1">
                    {entry.calories} cal • {entry.carbs}g carbs • {entry.protein}g protein • {entry.fat}g fat
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteFood(entry.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-xl ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {foodEntries.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>No foods logged today</p>
            <p className="text-sm">Add your first meal above</p>
          </div>
        )}
      </div>
    </div>
  );
}