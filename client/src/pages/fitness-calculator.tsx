import { useFitnessIntegration } from '@/hooks/use-fitness-integration';
import { saveCalculatorSettings,saveCalculationSex,type Settings } from '@/lib/fitness-recommendation';
import React, { useState } from "react";
import { useLocation } from "wouter";
import { Calculator, Target, Activity } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FitnessCalculator({ embedded = false, onNavigate }: { embedded?: boolean; onNavigate?: (path:string)=>void }) {
  const [, navigate] = useLocation();
  const go = (path:string) => onNavigate ? onNavigate(path) : navigate(path);
  const integration = useFitnessIntegration();
  const settings = integration.settings ?? {activity:'moderate',objective:'maintain',rate:'1',carbs:'40',protein:'30',fat:'30'};
  const [targetSaveError,setTargetSaveError] = useState('');
  const change = (key:keyof Settings,value:string) => {try {if(integration.error)throw Error(integration.error);saveCalculatorSettings({[key]:value});setTargetSaveError('');}catch(failure){setTargetSaveError((failure as Error).message);}};
  const activityLevel=settings.activity,goalType=settings.objective,goalRate=settings.rate,customCarbs=settings.carbs,customProtein=settings.protein,customFat=settings.fat;
  const setActivityLevel=(v:string)=>change('activity',v),setGoalType=(v:string)=>change('objective',v),setGoalRate=(v:string)=>change('rate',v),setCustomCarbs=(v:string)=>change('carbs',v),setCustomProtein=(v:string)=>change('protein',v),setCustomFat=(v:string)=>change('fat',v);
  const userData={weight:integration.measurements?.weight?.value??0,height:integration.measurements?.height?.value??0,age:integration.profile?.age??null,gender:integration.profile?.record.gender};
  const recommendation=integration.recommendation;
  const calculateBMR = () => recommendation?.bmr ?? 0;
  const calculateTDEE = () => recommendation?.tdee ?? 0;
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

  const getCalorieTarget = () => recommendation?.targets.calories ?? 0;
  const calculateMacros = () => ({carbs:{grams:recommendation?.targets.carbs??0,percent:Number(customCarbs)},protein:{grams:recommendation?.targets.protein??0,percent:Number(customProtein)},fat:{grams:recommendation?.targets.fat??0,percent:Number(customFat)}});
  const bmi = calculateBMI();
  const bmiInfo = getBMICategory(bmi);
  const calorieTarget = getCalorieTarget();
  const macros = calculateMacros();

  const macroPercentagesValid = !!recommendation;

  return (
    <div className="fitcircle-page">
      <div className="fitcircle-container">
        {/* Header */}
        {!embedded && <div className="text-center mb-8">
          <h1 className="fitcircle-page-title">Fitness Calculator</h1>
        </div>}

        <div className="space-y-8">
        {(integration.error || integration.issues.length>0) && <div role="status" className="rounded-xl border border-amber-500/40 p-3 text-sm text-amber-200">{integration.error || integration.issues.join(' ')}</div>}
        <div className="flex flex-wrap gap-2 mb-4"><Button variant="outline" onClick={()=>go('/measurements')}>Measurements</Button><Button variant="outline" onClick={()=>go('/food-tracker')}>Food Tracker</Button><Button variant="ghost" onClick={()=>go('/profile')}>My Fitness Profile</Button></div>
        {integration.measurements && <p className="text-xs text-slate-400 mb-3">{userData.weight ? `${userData.weight} lb · ${integration.measurements.weight?.date ?? 'undated legacy'}` : 'Weight missing'} · {userData.height ? `${userData.height} in · ${integration.measurements.height?.date ?? 'undated legacy'}` : 'Height missing'}</p>}
        <label className="block text-sm text-slate-300 mb-4">Calculation sex<Select value={userData.gender==='male'||userData.gender==='female'?userData.gender:''} onValueChange={value=>{try{saveCalculationSex(value as 'male'|'female');}catch(failure){setTargetSaveError((failure as Error).message);}}}><SelectTrigger aria-label="Calculation sex"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select></label>
        {integration.goals?.targetWeight && <div className="text-sm text-slate-300 mb-4">Weight goal: {integration.goals.targetWeight} lb · {integration.goals.intent ?? integration.goals.inferred ?? 'unspecified'}{(integration.goals.intent ?? integration.goals.inferred) && (integration.goals.intent ?? integration.goals.inferred)!==goalType && <><span className="text-amber-300"> · Calculator objective differs. </span><Button variant="outline" onClick={()=>setGoalType((integration.goals!.intent ?? integration.goals!.inferred)!)}>Align with measurement goal</Button></>}</div>}
        {integration.goals?.conflicts.map(message=><p key={message} className="text-sm text-amber-300 mb-2">{message}</p>)}
        
          {/* Calorie Tracker Section */}
          <div className="fitcircle-card-lg">
          <div className="flex items-center space-x-3 mb-6">
            <Target className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-semibold text-white">Calorie Tracker</h2>
          </div>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="type-metric text-3xl font-bold text-green-400 mb-2">
                {!recommendation ? '—' : calorieTarget.toLocaleString()}
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
                  className={`glass-control p-3 rounded-xl border-2 transition-colors text-sm flex items-center justify-center ${
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
          <div className="fitcircle-card-lg">
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
                  <div className="type-metric text-2xl font-bold text-white">{bmi}</div>
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
          <div className="fitcircle-card-lg">
          <div className="flex items-center space-x-3 mb-6">
            <Calculator className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Macro Calculator</h2>
          </div>

          {/* Personal macro percentages */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="macro-carbs" className="text-slate-300 text-sm">Carbs %</Label>
                <Input
                  type="number"
                  step="any"
                  id="macro-carbs"
                  value={customCarbs}
                  onChange={(e) => setCustomCarbs(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label htmlFor="macro-protein" className="text-slate-300 text-sm">Protein %</Label>
                <Input
                  type="number"
                  step="any"
                  id="macro-protein"
                  value={customProtein}
                  onChange={(e) => setCustomProtein(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label htmlFor="macro-fat" className="text-slate-300 text-sm">Fat %</Label>
                <Input
                  type="number"
                  step="any"
                  id="macro-fat"
                  value={customFat}
                  onChange={(e) => setCustomFat(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  min="0"
                  max="100"
                />
              </div>
            </div>

          {targetSaveError && <p role="alert" className="text-sm text-red-400 mb-4">{targetSaveError}</p>}

          {/* Macro Breakdown */}
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-lg font-semibold text-white">
                {!recommendation ? '—' : calorieTarget.toLocaleString()} calories/day
              </div>
            </div>

            {/* Macro Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card bg-slate-700 rounded-xl p-6 flex flex-col items-center justify-center">
                <div className="text-orange-400 font-semibold mb-2">Carbs</div>
                <div className="type-metric text-2xl font-bold text-white">{!recommendation ? '—' : macros.carbs.grams + 'g'}</div>
                <div className="text-sm text-slate-400">{macros.carbs.percent}%</div>
              </div>
              <div className="glass-card bg-slate-700 rounded-xl p-6 flex flex-col items-center justify-center">
                <div className="text-red-400 font-semibold mb-2">Protein</div>
                <div className="type-metric text-2xl font-bold text-white">{!recommendation ? '—' : macros.protein.grams + 'g'}</div>
                <div className="text-sm text-slate-400">{macros.protein.percent}%</div>
              </div>
              <div className="glass-card bg-slate-700 rounded-xl p-6 flex flex-col items-center justify-center">
                <div className="text-yellow-400 font-semibold mb-2">Fat</div>
                <div className="type-metric text-2xl font-bold text-white">{!recommendation ? '—' : macros.fat.grams + 'g'}</div>
                <div className="text-sm text-slate-400">{macros.fat.percent}%</div>
              </div>
            </div>


          </div>
        </div>
        </div>
      </div>
    </div>
  );
}