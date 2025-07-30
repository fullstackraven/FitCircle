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

    // Load macro targets from fitness calculator
    const loadMacroTargets = () => {
      const savedSettings = localStorage.getItem('fitness_calc_macro_style');
      const customCarbs = localStorage.getItem('fitness_calc_custom_carbs');
      const customProtein = localStorage.getItem('fitness_calc_custom_protein');
      const customFat = localStorage.getItem('fitness_calc_custom_fat');
      
      // Get user data for calorie calculation
      const measurementData = JSON.parse(localStorage.getItem('fitcircle_measurements_history') || '{}');
      const profileData = JSON.parse(localStorage.getItem('fitcircle_profile') || '{}');
      
      let height = 70, weight = 170, age = 25;
      const gender = profileData.gender || 'male';
      
      if (measurementData.height && measurementData.height.length > 0) {
        height = measurementData.height[measurementData.height.length - 1].value;
      }
      if (measurementData.weight && measurementData.weight.length > 0) {
        weight = measurementData.weight[measurementData.weight.length - 1].value;
      }
      if (profileData.age) {
        age = profileData.age;
      }

      // Calculate BMR and TDEE
      const bmr = gender === 'male' 
        ? 88.362 + (13.397 * (weight * 0.453592)) + (4.799 * (height * 2.54)) - (5.677 * age)
        : 447.593 + (9.247 * (weight * 0.453592)) + (3.098 * (height * 2.54)) - (4.330 * age);
      
      const activityLevel = localStorage.getItem('fitness_calc_activity_level') || 'moderate';
      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        very: 1.725,
        extremely: 1.9
      };
      
      const tdee = bmr * activityMultipliers[activityLevel as keyof typeof activityMultipliers];
      
      // Apply goal adjustments
      const goalType = localStorage.getItem('fitness_calc_goal_type') || 'maintain';
      const goalRate = parseFloat(localStorage.getItem('fitness_calc_goal_rate') || '1');
      
      let targetCalories = tdee;
      if (goalType === 'lose') {
        targetCalories -= (goalRate * 500);
      } else if (goalType === 'gain') {
        targetCalories += (goalRate * 500);
      }

      // Calculate macros based on style
      let carbsGrams, proteinGrams, fatGrams;
      
      if (savedSettings === 'tailored' && customCarbs && customProtein && customFat) {
        const carbsPercent = parseFloat(customCarbs) / 100;
        const proteinPercent = parseFloat(customProtein) / 100;
        const fatPercent = parseFloat(customFat) / 100;
        
        carbsGrams = (targetCalories * carbsPercent) / 4;
        proteinGrams = (targetCalories * proteinPercent) / 4;
        fatGrams = (targetCalories * fatPercent) / 9;
      } else {
        // Use preset styles
        const presets = {
          standard: { carbs: 0.45, protein: 0.25, fat: 0.30 },
          highProtein: { carbs: 0.35, protein: 0.40, fat: 0.25 },
          lowCarb: { carbs: 0.20, protein: 0.35, fat: 0.45 }
        };
        
        const preset = presets[savedSettings as keyof typeof presets] || presets.standard;
        carbsGrams = (targetCalories * preset.carbs) / 4;
        proteinGrams = (targetCalories * preset.protein) / 4;
        fatGrams = (targetCalories * preset.fat) / 9;
      }

      setMacroTargets({
        calories: Math.round(targetCalories),
        carbs: Math.round(carbsGrams),
        protein: Math.round(proteinGrams),
        fat: Math.round(fatGrams)
      });
    };

    loadMacroTargets();
    
    // Set up polling for changes from fitness calculator
    const interval = setInterval(loadMacroTargets, 3000);
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
  const totals = foodEntries.reduce((acc, entry) => ({
    calories: acc.calories + entry.calories,
    carbs: acc.carbs + entry.carbs,
    protein: acc.protein + entry.protein,
    fat: acc.fat + entry.fat
  }), { calories: 0, carbs: 0, protein: 0, fat: 0 });

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-screen pb-32" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="text-slate-500 hover:text-white transition-colors flex items-center space-x-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-xl font-bold text-white">Food Tracker</h1>
        <div className="w-[60px]" />
      </div>

      {/* Macro Overview */}
      <div className="bg-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Today's Progress</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Calories */}
          <div className="bg-slate-700 rounded-xl p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {totals.calories}
              </div>
              <div className="text-sm text-slate-400">/ {macroTargets.calories}</div>
              <div className="text-xs text-slate-500 mt-1">Calories</div>
            </div>
          </div>

          {/* Carbs */}
          <div className="bg-slate-700 rounded-xl p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {Math.round(totals.carbs)}g
              </div>
              <div className="text-sm text-slate-400">/ {macroTargets.carbs}g</div>
              <div className="text-xs text-slate-500 mt-1">Carbs</div>
            </div>
          </div>

          {/* Protein */}
          <div className="bg-slate-700 rounded-xl p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {Math.round(totals.protein)}g
              </div>
              <div className="text-sm text-slate-400">/ {macroTargets.protein}g</div>
              <div className="text-xs text-slate-500 mt-1">Protein</div>
            </div>
          </div>

          {/* Fat */}
          <div className="bg-slate-700 rounded-xl p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">
                {Math.round(totals.fat)}g
              </div>
              <div className="text-sm text-slate-400">/ {macroTargets.fat}g</div>
              <div className="text-xs text-slate-500 mt-1">Fat</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Food Form */}
      <div className="bg-slate-800 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Add Food</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-slate-300">Food Name</Label>
            <Input
              type="text"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="Enter food name"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Calories</Label>
              <Input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="0"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Carbs (g)</Label>
              <Input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="0"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Protein (g)</Label>
              <Input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="0"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Fat (g)</Label>
              <Input
                type="number"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="0"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          
          <Button
            onClick={handleAddFood}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Food
          </Button>
        </div>
      </div>

      {/* Food Entries */}
      {foodEntries.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Today's Foods</h3>
          <div className="space-y-3">
            {foodEntries.slice().reverse().map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-xl">
                <div className="flex-1">
                  <div className="text-white font-medium">{entry.name}</div>
                  <div className="text-sm text-slate-400">
                    {entry.calories} cal • {Math.round(entry.carbs)}g carbs • {Math.round(entry.protein)}g protein • {Math.round(entry.fat)}g fat
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteFood(entry.id)}
                  className="w-8 h-8 rounded-full bg-slate-600 hover:bg-slate-500 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}