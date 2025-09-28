import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Target, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMeasurements } from '@/hooks/use-measurements';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { GoalCircle } from '@/components/GoalCircle';

interface MeasurementFieldConfig {
  key: keyof import('@/hooks/use-measurements').MeasurementData;
  label: string;
  unit: string;
  category: string;
}

const measurementFields: MeasurementFieldConfig[] = [
  { key: 'weight', label: 'Weight', unit: 'lbs', category: 'Body' },
  { key: 'height', label: 'Height', unit: 'in', category: 'Body' },
  { key: 'bodyFat', label: 'Body Fat', unit: '%', category: 'Body' },
  { key: 'neck', label: 'Neck', unit: 'in', category: 'Circumference' },
  { key: 'chest', label: 'Chest', unit: 'in', category: 'Circumference' },
  { key: 'waist', label: 'Waist', unit: 'in', category: 'Circumference' },
  { key: 'hips', label: 'Hips', unit: 'in', category: 'Circumference' },
  { key: 'bicepLeft', label: 'Bicep (L)', unit: 'in', category: 'Arms' },
  { key: 'bicepRight', label: 'Bicep (R)', unit: 'in', category: 'Arms' },
  { key: 'forearmLeft', label: 'Forearm (L)', unit: 'in', category: 'Arms' },
  { key: 'forearmRight', label: 'Forearm (R)', unit: 'in', category: 'Arms' },
  { key: 'thighLeft', label: 'Thigh (L)', unit: 'in', category: 'Legs' },
  { key: 'thighRight', label: 'Thigh (R)', unit: 'in', category: 'Legs' },
  { key: 'calfLeft', label: 'Calf (L)', unit: 'in', category: 'Legs' },
  { key: 'calfRight', label: 'Calf (R)', unit: 'in', category: 'Legs' },
];

export default function MeasurementsPage() {
  const [, navigate] = useLocation();
  
  // Check if we came from dashboard
  const fromDashboard = new URLSearchParams(window.location.search).get('from') === 'dashboard';
  
  const handleBack = () => {
    navigate('/wellness');
  };
  const { addMeasurement, getLatestValue, getValueTrend, getChartData } = useMeasurements();
  
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalWeightInput, setGoalWeightInput] = useState('');
  const [goalBodyFatInput, setGoalBodyFatInput] = useState('');
  const [weightGoalType, setWeightGoalType] = useState<'gain' | 'lose'>('lose');
  const [focusedInputs, setFocusedInputs] = useState<{ [key: string]: boolean }>({});
  const [goalWeightFocused, setGoalWeightFocused] = useState(false);
  const [goalBodyFatFocused, setGoalBodyFatFocused] = useState(false);

  useEffect(() => {
    // Load latest values
    const initialValues: { [key: string]: string } = {};
    measurementFields.forEach(field => {
      const latestValue = getLatestValue(field.key);
      initialValues[field.key] = latestValue?.toString() || '';
    });
    setInputValues(initialValues);
    
    // Load saved goals from multiple sources for cross-compatibility
    const savedGoals = localStorage.getItem('fitcircle_goals');
    const weightGoal = localStorage.getItem('fitcircle_goal_weight');
    const bodyFatGoal = localStorage.getItem('fitcircle_goal_bodyfat');
    const weightGoalTypeStored = localStorage.getItem('fitcircle_weight_goal_type');
    
    if (savedGoals) {
      try {
        const goals = JSON.parse(savedGoals);
        setGoalWeightInput(weightGoal || goals.targetWeight?.toString() || '');
        setGoalBodyFatInput(bodyFatGoal || goals.targetBodyFat?.toString() || '');
        setWeightGoalType(weightGoalTypeStored as 'gain' | 'lose' || goals.weightGoalType || 'lose');
      } catch (error) {
        console.error('Failed to parse goals:', error);
      }
    } else {
      // Load from individual goal keys if fitcircle_goals doesn't exist
      setGoalWeightInput(weightGoal || '');
      setGoalBodyFatInput(bodyFatGoal || '');
      setWeightGoalType(weightGoalTypeStored as 'gain' | 'lose' || 'lose');
    }
  }, []);

  const handleInputChange = (key: string, value: string) => {
    setInputValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSetGoals = () => {
    const weightGoal = parseFloat(goalWeightInput);
    const bodyFatGoal = parseFloat(goalBodyFatInput);
    
    if (isNaN(weightGoal) && isNaN(bodyFatGoal)) {
      alert('Please enter at least one valid goal');
      return;
    }
    
    // Save to individual goal keys for cross-compatibility with Goals page
    if (!isNaN(weightGoal)) {
      localStorage.setItem('fitcircle_goal_weight', weightGoal.toString());
    }
    if (!isNaN(bodyFatGoal)) {
      localStorage.setItem('fitcircle_goal_bodyfat', bodyFatGoal.toString());
    }
    
    // Save weight goal type
    localStorage.setItem('fitcircle_weight_goal_type', weightGoalType);
    
    // Load existing goals and update fitcircle_goals object
    let goals = {};
    const savedGoals = localStorage.getItem('fitcircle_goals');
    if (savedGoals) {
      try {
        goals = JSON.parse(savedGoals);
      } catch (error) {
        console.error('Failed to parse existing goals:', error);
      }
    }
    
    // Update goals object
    const updatedGoals = {
      ...goals,
      ...(weightGoal && !isNaN(weightGoal) && { targetWeight: weightGoal }),
      ...(bodyFatGoal && !isNaN(bodyFatGoal) && { targetBodyFat: bodyFatGoal }),
      weightGoalType: weightGoalType
    };
    
    localStorage.setItem('fitcircle_goals', JSON.stringify(updatedGoals));
    setIsGoalModalOpen(false);
    alert('Goals saved successfully!');
  };

  const handleSave = () => {
    let savedCount = 0;
    let hasValidData = false;
    
    // Check if we have any valid input data first
    measurementFields.forEach(field => {
      const value = parseFloat(inputValues[field.key]);
      if (!isNaN(value) && value > 0) {
        hasValidData = true;
      }
    });
    
    if (!hasValidData) {
      alert('Please enter at least one valid measurement before saving.');
      return;
    }
    
    // Save measurements with history
    measurementFields.forEach(field => {
      const value = parseFloat(inputValues[field.key]);
      if (!isNaN(value) && value > 0) {
        try {
          addMeasurement(field.key, value);
          savedCount++;
        } catch (error) {
          console.error(`Error saving ${field.key}:`, error);
        }
      }
    });
    
    if (savedCount > 0) {
      // Show success feedback but stay on measurements page
      alert(`Successfully saved ${savedCount} measurement${savedCount > 1 ? 's' : ''}!`);
    } else {
      alert('Failed to save measurements. Please try again.');
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const categorizedFields = measurementFields.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {} as { [category: string]: MeasurementFieldConfig[] });

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
          <h1 className="fitcircle-page-title">Measurements</h1>
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="flex items-center space-x-1 fitcircle-text-muted hover:text-white transition-colors"
          >
            <Target className="w-5 h-5" />
            <span>Goal</span>
          </button>
        </div>

        {/* Input Section */}
        <div className="space-y-6">
          {Object.entries(categorizedFields).map(([category, fields]) => (
            <section key={category} className="fitcircle-card-lg">
              <h2 className="text-lg font-semibold mb-4 text-white">{category}</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {fields.map(field => (
                  <div key={field.key}>
                    <Label htmlFor={field.key} className="text-slate-300 flex items-center space-x-2">
                      <span>{field.label}</span>
                      {getLatestValue(field.key) && getTrendIcon(getValueTrend(field.key))}
                    </Label>
                    <Input
                      id={field.key}
                      type="number"
                      value={inputValues[field.key] || ''}
                      placeholder={focusedInputs[field.key] ? "" : "0"}
                      step="0.1"
                      onFocus={() => setFocusedInputs(prev => ({ ...prev, [field.key]: true }))}
                      onBlur={() => setFocusedInputs(prev => ({ ...prev, [field.key]: false }))}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                    />
                    {getLatestValue(field.key) && (
                      <div className="text-xs text-slate-400 mt-1">
                        Last: {getLatestValue(field.key)}{field.unit}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
          
          <Button
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium"
          >
            Save Measurements
          </Button>
          
          {/* Trend Graphs Section */}
          <section className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">Trend Graphs</h2>
            
            <div className="flex overflow-x-auto space-x-4 pb-4 horizontal-scroll">
              {measurementFields
                .filter(field => getChartData(field.key).length > 0)
                .map(field => {
                  const chartData = getChartData(field.key).map(entry => ({
                    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    value: entry.value
                  }));

                  return (
                    <div key={field.key} className="flex-shrink-0 w-80 bg-slate-700 rounded-xl p-4">
                      <h3 className="text-lg font-semibold mb-2 text-white flex items-center space-x-2">
                        <span>{field.label}</span>
                        {getTrendIcon(getValueTrend(field.key))}
                      </h3>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <XAxis 
                              dataKey="date" 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: '#94a3b8' }}
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: '#94a3b8' }}
                              domain={chartData.length === 1 ? ['dataMin - 5', 'dataMax + 5'] : ['auto', 'auto']}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#3b82f6" 
                              strokeWidth={2}
                              dot={{ r: 5, fill: '#3b82f6' }}
                              connectNulls={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-2 text-sm text-slate-400">
                        Latest: {getLatestValue(field.key)}{field.unit} | 
                        {chartData.length} data point{chartData.length > 1 ? 's' : ''}
                        {chartData.length === 1 && (
                          <div className="text-xs text-blue-400 mt-1">
                            Add more entries to see trend line
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
            
            {measurementFields.filter(field => getChartData(field.key).length > 0).length === 0 && (
              <div className="text-center text-slate-500 py-8">
                <div className="text-4xl mb-2">📈</div>
                <h3 className="text-md font-semibold mb-1">No Trend Data Yet</h3>
                <p className="text-sm">Add measurements to see trend graphs here</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Goal Setting Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Measurement Goals</h3>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Goal Progress Circles */}
            <div className="flex justify-center space-x-8 mb-8">
              {/* Weight Goal Circle */}
              <GoalCircle
                percentage={(() => {
                  const currentWeight = getLatestValue('weight') || 0;
                  const targetWeight = parseFloat(goalWeightInput) || 0;
                  if (targetWeight === 0 || currentWeight === 0) return 0;
                  
                  // Match Goals page logic: depends on whether goal is to gain or lose weight
                  if (weightGoalType === 'gain') {
                    return currentWeight >= targetWeight ? 100 : Math.min((currentWeight / targetWeight) * 100, 100);
                  } else {
                    return currentWeight <= targetWeight ? 100 : Math.max(0, (targetWeight / currentWeight) * 100);
                  }
                })()}
                color="rgb(34, 197, 94)"
                size={140}
                currentValue={getLatestValue('weight') || 0}
                goalValue={parseFloat(goalWeightInput) || 0}
                unit="lbs"
                title="Weight"
                description="Current vs target"
              />
              
              {/* Body Fat Goal Circle */}
              <GoalCircle
                percentage={(() => {
                  const currentBodyFat = getLatestValue('bodyFat') || 0;
                  const targetBodyFat = parseFloat(goalBodyFatInput) || 0;
                  if (targetBodyFat === 0) return 0;
                  
                  // Match Goals page logic: closer to target = higher percentage
                  // If current is higher than target, show progress as (target/current * 100)  
                  // If current is lower than target, show 100%
                  if (currentBodyFat === 0) return 0;
                  if (currentBodyFat <= targetBodyFat) return 100;
                  return Math.min(100, (targetBodyFat / currentBodyFat) * 100);
                })()}
                color="rgb(239, 68, 68)"
                size={140}
                currentValue={getLatestValue('bodyFat') || 0}
                goalValue={parseFloat(goalBodyFatInput) || 0}
                unit="%"
                title="Body Fat"
                description="Current vs target"
              />
            </div>

            {/* Goal Input Forms */}
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Weight Goal Type</Label>
                <div className="flex space-x-3 mt-2">
                  <button
                    onClick={() => setWeightGoalType('lose')}
                    className={`flex-1 py-2 px-4 rounded-xl border-2 transition-colors ${
                      weightGoalType === 'lose' 
                        ? 'border-green-500 bg-green-500/20 text-green-400' 
                        : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    Lose Weight
                  </button>
                  <button
                    onClick={() => setWeightGoalType('gain')}
                    className={`flex-1 py-2 px-4 rounded-xl border-2 transition-colors ${
                      weightGoalType === 'gain' 
                        ? 'border-green-500 bg-green-500/20 text-green-400' 
                        : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    Gain Weight
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="goalWeight" className="text-slate-300">
                  Target Weight (lbs)
                </Label>
                <Input
                  id="goalWeight"
                  type="number"
                  value={goalWeightInput}
                  onChange={(e) => setGoalWeightInput(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  placeholder={goalWeightFocused ? "" : "Enter target weight"}
                  onFocus={() => setGoalWeightFocused(true)}
                  onBlur={() => setGoalWeightFocused(false)}
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="goalBodyFat" className="text-slate-300">
                  Target Body Fat (%)
                </Label>
                <Input
                  id="goalBodyFat"
                  type="number"
                  value={goalBodyFatInput}
                  onChange={(e) => setGoalBodyFatInput(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  placeholder={goalBodyFatFocused ? "" : "Enter target body fat %"}
                  onFocus={() => setGoalBodyFatFocused(true)}
                  onBlur={() => setGoalBodyFatFocused(false)}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSetGoals}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Set Goals
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}