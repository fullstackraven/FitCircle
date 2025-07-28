import React, { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Calculator, Target, Activity } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserData {
  height: number; // inches
  weight: number; // lbs
  age: number;
  gender: string;
}

export default function FitnessCalculator() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/fitness-calculator");
  const searchParams = new URLSearchParams(window.location.search);
  const fromDashboard = searchParams.get('from') === 'dashboard';

  // User data from measurements
  const [userData, setUserData] = useState<UserData>({
    height: 0,
    weight: 0,
    age: 25,
    gender: 'male'
  });

  // Calculator states
  const [activityLevel, setActivityLevel] = useState<string>('moderate');
  const [goalType, setGoalType] = useState<string>('maintain');
  const [goalRate, setGoalRate] = useState<string>('1');
  const [macroStyle, setMacroStyle] = useState<string>('standard');
  const [customCarbs, setCustomCarbs] = useState<string>('40');
  const [customProtein, setCustomProtein] = useState<string>('30');
  const [customFat, setCustomFat] = useState<string>('30');

  useEffect(() => {
    const loadUserData = () => {
      // Load user data from measurements localStorage - using the correct key 'fitcircle_measurements_history'
      const profileData = JSON.parse(localStorage.getItem('fitcircle_profile') || '{}');
      const measurementData = JSON.parse(localStorage.getItem('fitcircle_measurements_history') || '{}');
      
      let height = 0;
      let weight = 0;
      
      // Get latest height and weight from measurements using the correct data structure
      if (measurementData.height && measurementData.height.length > 0) {
        // Get the most recent height measurement
        const latestHeight = measurementData.height[measurementData.height.length - 1];
        height = latestHeight.value;
      }
      if (measurementData.weight && measurementData.weight.length > 0) {
        // Get the most recent weight measurement
        const latestWeight = measurementData.weight[measurementData.weight.length - 1];
        weight = latestWeight.value;
      }

      setUserData({
        height: height || 70, // default 5'10" only if no data exists
        weight: weight || 170, // default 170 lbs only if no data exists
        age: profileData.age || 25,
        gender: profileData.gender || 'male'
      });
    };

    // Load data initially
    loadUserData();

    // Set up an interval to check for data updates every 2 seconds for real-time sync
    const interval = setInterval(loadUserData, 2000);

    // Listen for localStorage changes (when user updates measurements in another tab/page)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fitcircle_measurements_history' || e.key === 'fitcircle_profile') {
        loadUserData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleBack = () => {
    if (fromDashboard) {
      navigate('/?from=dashboard');
    } else {
      navigate('/');
    }
  };

  // BMR calculation using Mifflin-St Jeor Equation
  const calculateBMR = () => {
    const heightCm = userData.height * 2.54;
    const weightKg = userData.weight * 0.453592;
    
    if (userData.gender === 'male') {
      return 10 * weightKg + 6.25 * heightCm - 5 * userData.age + 5;
    } else {
      return 10 * weightKg + 6.25 * heightCm - 5 * userData.age - 161;
    }
  };

  // TDEE calculation
  const calculateTDEE = () => {
    const bmr = calculateBMR();
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very: 1.725,
      extremely: 1.9
    };
    return Math.round(bmr * activityMultipliers[activityLevel as keyof typeof activityMultipliers]);
  };

  // BMI calculation
  const calculateBMI = () => {
    const heightM = userData.height * 0.0254;
    const weightKg = userData.weight * 0.453592;
    return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  };

  // BMI category and color
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Low', color: 'rgb(59, 130, 246)' }; // blue
    if (bmi >= 18.5 && bmi < 25) return { category: 'Average', color: 'rgb(34, 197, 94)' }; // green
    if (bmi >= 25 && bmi < 30) return { category: 'Above Average', color: 'rgb(245, 158, 11)' }; // amber
    return { category: 'High', color: 'rgb(239, 68, 68)' }; // red
  };

  // Calorie target based on goal
  const getCalorieTarget = () => {
    const tdee = calculateTDEE();
    const rateNum = parseFloat(goalRate);
    const calorieAdjustment = rateNum * 500; // 500 calories per lb
    
    if (goalType === 'lose') {
      return Math.round(tdee - calorieAdjustment);
    } else if (goalType === 'gain') {
      return Math.round(tdee + calorieAdjustment);
    }
    return tdee;
  };

  // Macro calculations
  const calculateMacros = () => {
    const calories = getCalorieTarget();
    let carbPercent, proteinPercent, fatPercent;

    switch (macroStyle) {
      case 'high-protein':
        carbPercent = 45; proteinPercent = 30; fatPercent = 25;
        break;
      case 'low-carb':
        carbPercent = 40; proteinPercent = 30; fatPercent = 30;
        break;
      case 'tailored':
        carbPercent = parseInt(customCarbs);
        proteinPercent = parseInt(customProtein);
        fatPercent = parseInt(customFat);
        break;
      default: // standard
        carbPercent = 50; proteinPercent = 30; fatPercent = 20;
    }

    const carbCalories = calories * (carbPercent / 100);
    const proteinCalories = calories * (proteinPercent / 100);
    const fatCalories = calories * (fatPercent / 100);

    return {
      carbs: { grams: Math.round(carbCalories / 4), percent: carbPercent },
      protein: { grams: Math.round(proteinCalories / 4), percent: proteinPercent },
      fat: { grams: Math.round(fatCalories / 9), percent: fatPercent }
    };
  };

  const bmi = calculateBMI();
  const bmiInfo = getBMICategory(bmi);
  const calorieTarget = getCalorieTarget();
  const macros = calculateMacros();

  return (
    <div className="min-h-screen text-white pb-32" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={handleBack}
          className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h1 className="text-xl font-semibold">Fitness Calculator</h1>
        <div className="w-16"></div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-8">
        
        {/* Calorie Tracker Section */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Target className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-semibold text-white">Calorie Tracker</h2>
          </div>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {calorieTarget.toLocaleString()}
              </div>
              <div className="text-slate-300">calories per day</div>
              <div className="text-sm text-slate-400 mt-2">
                {goalType === 'lose' ? `To lose ${goalRate} lb${goalRate !== '1' ? 's' : ''} per week` :
                 goalType === 'gain' ? `To gain ${goalRate} lb${goalRate !== '1' ? 's' : ''} per week` :
                 'To maintain current weight'}
              </div>
            </div>

            {/* Activity Level Selection */}
            <div className="space-y-2">
              <Label className="text-slate-300">Activity Level</Label>
              <Select value={activityLevel} onValueChange={setActivityLevel}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="sedentary" className="text-white hover:bg-slate-600">Sedentary (little/no exercise)</SelectItem>
                  <SelectItem value="light" className="text-white hover:bg-slate-600">Light (1-3 days/week)</SelectItem>
                  <SelectItem value="moderate" className="text-white hover:bg-slate-600">Moderate (3-5 days/week)</SelectItem>
                  <SelectItem value="very" className="text-white hover:bg-slate-600">Very Active (6-7 days/week)</SelectItem>
                  <SelectItem value="extremely" className="text-white hover:bg-slate-600">Extremely Active (2x/day)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Goal Type Selection */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'lose', label: 'Lose Weight', color: 'red' },
                { value: 'maintain', label: 'Maintain', color: 'blue' },
                { value: 'gain', label: 'Gain Weight', color: 'green' }
              ].map(goal => (
                <button
                  key={goal.value}
                  onClick={() => setGoalType(goal.value)}
                  className={`p-3 rounded-xl border-2 transition-colors text-sm ${
                    goalType === goal.value 
                      ? `border-${goal.color}-500 bg-${goal.color}-500/20 text-${goal.color}-400` 
                      : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {goal.label}
                </button>
              ))}
            </div>

            {goalType !== 'maintain' && (
              <div className="space-y-2">
                <Label className="text-slate-300">Rate (lbs per week)</Label>
                <Select value={goalRate} onValueChange={setGoalRate}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="0.5" className="text-white hover:bg-slate-600">0.5 lbs/week</SelectItem>
                    <SelectItem value="1" className="text-white hover:bg-slate-600">1 lb/week</SelectItem>
                    <SelectItem value="1.5" className="text-white hover:bg-slate-600">1.5 lbs/week</SelectItem>
                    <SelectItem value="2" className="text-white hover:bg-slate-600">2 lbs/week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* BMI Calculator Section */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Activity className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">BMI Calculator</h2>
          </div>

          {userData.height > 0 && userData.weight > 0 ? (
            <div className="text-center space-y-4">
              {/* BMI Circle Display */}
              <div className="relative inline-block">
                <svg width="160" height="160" className="transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="rgb(71, 85, 105)"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke={bmiInfo.color}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${Math.min(100, (bmi / 40) * 100) * 4.4} 440`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-white">{bmi}</div>
                  <div className="text-sm text-slate-400">{bmiInfo.category}</div>
                </div>
              </div>

              <div className="text-sm text-slate-300 space-y-1">
                <div>Height: {Math.floor(userData.height / 12)}'{userData.height % 12}"</div>
                <div>Weight: {userData.weight} lbs</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-slate-400 mb-4">Add height and weight in Measurements to see your BMI</div>
              <Button
                onClick={() => navigate('/measurements')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Go to Measurements
              </Button>
            </div>
          )}
        </div>

        {/* Macro Calculator Section */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Calculator className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Macro Calculator</h2>
          </div>

          {/* Macro Style Selection */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {[
              { value: 'standard', label: 'Standard' },
              { value: 'high-protein', label: 'High Protein' },
              { value: 'low-carb', label: 'Low Carb' },
              { value: 'tailored', label: 'Tailored' }
            ].map(style => (
              <button
                key={style.value}
                onClick={() => setMacroStyle(style.value)}
                className={`p-3 rounded-xl border-2 transition-colors text-sm ${
                  macroStyle === style.value 
                    ? 'border-purple-500 bg-purple-500/20 text-purple-400' 
                    : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>

          {/* Tailored Macro Inputs */}
          {macroStyle === 'tailored' && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <Label className="text-slate-300 text-sm">Carbs %</Label>
                <Input
                  type="number"
                  value={customCarbs}
                  onChange={(e) => setCustomCarbs(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Protein %</Label>
                <Input
                  type="number"
                  value={customProtein}
                  onChange={(e) => setCustomProtein(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Fat %</Label>
                <Input
                  type="number"
                  value={customFat}
                  onChange={(e) => setCustomFat(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          )}

          {/* Macro Breakdown */}
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-lg font-semibold text-white">
                {calorieTarget.toLocaleString()} calories/day
              </div>
            </div>

            {/* Macro Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-700 rounded-xl p-4 text-center">
                <div className="text-orange-400 font-semibold mb-2">Carbs</div>
                <div className="text-2xl font-bold text-white">{macros.carbs.grams}g</div>
                <div className="text-sm text-slate-400">{macros.carbs.percent}%</div>
              </div>
              <div className="bg-slate-700 rounded-xl p-4 text-center">
                <div className="text-red-400 font-semibold mb-2">Protein</div>
                <div className="text-2xl font-bold text-white">{macros.protein.grams}g</div>
                <div className="text-sm text-slate-400">{macros.protein.percent}%</div>
              </div>
              <div className="bg-slate-700 rounded-xl p-4 text-center">
                <div className="text-yellow-400 font-semibold mb-2">Fat</div>
                <div className="text-2xl font-bold text-white">{macros.fat.grams}g</div>
                <div className="text-sm text-slate-400">{macros.fat.percent}%</div>
              </div>
            </div>

            {/* Preset Comparisons */}
            <div className="mt-6 space-y-2">
              <div className="text-sm font-semibold text-slate-300 mb-3">Compare Styles:</div>
              {[
                { name: 'Standard', carbs: 50, protein: 30, fat: 20 },
                { name: 'High Protein', carbs: 45, protein: 30, fat: 25 },
                { name: 'Low Carb', carbs: 40, protein: 30, fat: 30 }
              ].map(preset => {
                const presetCarbs = Math.round((calorieTarget * (preset.carbs / 100)) / 4);
                const presetProtein = Math.round((calorieTarget * (preset.protein / 100)) / 4);
                const presetFat = Math.round((calorieTarget * (preset.fat / 100)) / 9);
                
                return (
                  <div key={preset.name} className="flex justify-between items-center text-sm">
                    <div className="text-slate-300 font-medium">{preset.name}</div>
                    <div className="text-slate-400">
                      {presetCarbs}g | {presetProtein}g | {presetFat}g
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}