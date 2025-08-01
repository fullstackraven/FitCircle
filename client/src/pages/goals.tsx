import { useState, useEffect } from 'react';
import { ChevronLeft, Droplet, Brain, Clock, Scale, Percent, Target, Edit3, Check, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { useHydration } from '@/hooks/use-hydration';
import { useWorkouts } from '@/hooks/use-workouts';
import { GoalCircle } from '@/components/GoalCircle';
import { 
  calculateMeditation7DayAverage, 
  calculateMeditationProgress, 
  getMeditationGoal, 
  setMeditationGoal,
  getMeditationLogs 
} from '@/utils/meditation-calc';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';
import { getTodayString } from '@/lib/date-utils';

export default function GoalsPageFinal() {
  const [, navigate] = useLocation();

  // Check if we came from dashboard
  const fromDashboard = new URLSearchParams(window.location.search).get('from') === 'dashboard';

  const handleBack = () => {
    if (fromDashboard) {
      navigate('/?dashboard=open');
    } else {
      navigate('/');
    }
  };

  // Goals state from localStorage
  const [goals, setGoals] = useState({
    hydrationOz: 64,
    meditationMinutes: 10,
    fastingHours: 16,
    weightLbs: 150,
    targetBodyFat: 15,
    workoutConsistency: 100,
    weightGoalType: 'lose' // 'lose' or 'gain'
  });

  // Load goals from localStorage
  useEffect(() => {
    const loadGoals = () => {
      const hydrationGoal = localStorage.getItem('fitcircle_goal_hydration');
      const meditationGoal = localStorage.getItem('fitcircle_goal_meditation');
      const fastingGoal = localStorage.getItem('fitcircle_goal_fasting');
      const weightGoal = localStorage.getItem('fitcircle_goal_weight');
      const bodyFatGoal = localStorage.getItem('fitcircle_goal_bodyfat');
      const weightGoalType = localStorage.getItem('fitcircle_weight_goal_type');

      // Check for goals in multiple locations
      let measurementGoals = { targetWeight: 150, targetBodyFat: 15 };
      
      // Check fitcircle_goals first
      const goalsData = localStorage.getItem('fitcircle_goals');
      if (goalsData) {
        try {
          const parsed = JSON.parse(goalsData);
          measurementGoals.targetWeight = parsed.targetWeight || 150;
          measurementGoals.targetBodyFat = parsed.targetBodyFat || 15;
        } catch (e) {
          console.error('Error parsing goals data:', e);
        }
      }
      
      // Also check measurements for weight/body fat goals
      const measurements = localStorage.getItem('fitcircle_measurements');
      if (measurements) {
        try {
          const data = JSON.parse(measurements);
          measurementGoals.targetWeight = data.targetWeight || measurementGoals.targetWeight;
          measurementGoals.targetBodyFat = data.targetBodyFat || measurementGoals.targetBodyFat;
        } catch (e) {
          console.error('Error parsing measurements:', e);
        }
      }

      setGoals(prev => ({
        ...prev,
        hydrationOz: hydrationGoal ? parseFloat(hydrationGoal) : 64,
        meditationMinutes: meditationGoal ? parseFloat(meditationGoal) : 10,
        fastingHours: fastingGoal ? parseFloat(fastingGoal) : 16,
        weightLbs: weightGoal ? parseFloat(weightGoal) : measurementGoals.targetWeight,
        targetBodyFat: bodyFatGoal ? parseFloat(bodyFatGoal) : measurementGoals.targetBodyFat,
        workoutConsistency: 100,
        weightGoalType: weightGoalType || 'lose'
      }));
    };

    loadGoals();
    
    // Also reload goals when the window gains focus (user navigates back to this page)
    const handleFocus = () => {
      loadGoals();
    };
    
    // Listen for storage changes to sync goals between pages
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fitcircle_goal_meditation') {
        loadGoals();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Get current values using same logic as working modals
  const { currentDayOz, dailyGoalOz, progressPercentage: hydrationProgress } = useHydration();
  
  // Also get hydration from direct localStorage if hook fails
  const getHydrationData = () => {
    const hydrationData = localStorage.getItem('fitcircle_hydration_data');
    if (hydrationData) {
      try {
        const data = JSON.parse(hydrationData);
        return {
          currentDayOz: data.currentDayOz || 0,
          dailyGoalOz: data.dailyGoalOz || 64
        };
      } catch (e) {
        return { currentDayOz: 0, dailyGoalOz: 64 };
      }
    }
    return { currentDayOz: 0, dailyGoalOz: 64 };
  };
  
  const hydrationBackup = getHydrationData();
  const actualCurrentOz = currentDayOz || hydrationBackup.currentDayOz;
  const actualGoalOz = dailyGoalOz || hydrationBackup.dailyGoalOz;

  // Use shared meditation calculation
  const meditationLogs = getMeditationLogs();
  const meditationCurrent = Math.round(calculateMeditation7DayAverage(meditationLogs));

  const getCurrentFasting = () => {
    const fastingLogs = localStorage.getItem('fitcircle_fasting_logs');
    if (fastingLogs) {
      try {
        const logs = JSON.parse(fastingLogs);
        const completedFasts: number[] = [];
        
        if (Array.isArray(logs)) {
          logs.forEach((log: any) => {
            if (log?.endDate && log?.startDate && log?.endTime && log?.startTime) {
              const start = new Date(`${log.startDate}T${log.startTime}`);
              const end = new Date(`${log.endDate}T${log.endTime}`);
              const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
              if (duration > 0 && duration < 48) {
                completedFasts.push(duration);
              }
            }
          });
        }
        
        if (completedFasts.length > 0) {
          const averageHours = completedFasts.reduce((sum, hours) => sum + hours, 0) / completedFasts.length;
          return Math.round(averageHours * 10) / 10;
        }
      } catch (e) {
        return 0;
      }
    }
    return 0;
  };

  const getCurrentWeight = () => {
    // Check direct weight value first
    const weight = localStorage.getItem('fitcircle_weight');
    if (weight) {
      return parseFloat(weight) || 0;
    }
    
    // Fallback to measurements object
    const measurements = localStorage.getItem('fitcircle_measurements');
    if (measurements) {
      try {
        const data = JSON.parse(measurements);
        return data.currentWeight || 0;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  };

  const getCurrentBodyFat = () => {
    // Check direct body fat value first
    const bodyFat = localStorage.getItem('fitcircle_body_fat');
    if (bodyFat) {
      return parseFloat(bodyFat) || 0;
    }
    
    // Fallback to measurements object
    const measurements = localStorage.getItem('fitcircle_measurements');
    if (measurements) {
      try {
        const data = JSON.parse(measurements);
        return data.currentBodyFat || 0;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  };

  // Use the working useWorkouts hook for workout consistency
  const { getTotalStats } = useWorkouts();
  
  const getWorkoutConsistency = () => {
    const stats = getTotalStats();
    return Math.round(stats.totalGoalPercentage || 0);
  };

  // Calculate progress percentages
  const fastingCurrent = getCurrentFasting();
  const weightCurrent = getCurrentWeight();
  const bodyFatCurrent = getCurrentBodyFat();
  const workoutCurrent = getWorkoutConsistency();

  // Use shared meditation calculation for progress
  const meditationProgress = calculateMeditationProgress(meditationLogs, getMeditationGoal());
  const fastingProgress = goals.fastingHours > 0 ? Math.min((fastingCurrent / goals.fastingHours) * 100, 100) : 0;
  // Weight progress: depends on whether goal is to gain or lose weight
  const weightProgress = goals.weightLbs > 0 && weightCurrent > 0 ? 
    (goals.weightGoalType === 'gain' 
      ? (weightCurrent >= goals.weightLbs ? 100 : Math.min((weightCurrent / goals.weightLbs) * 100, 100))
      : (weightCurrent <= goals.weightLbs ? 100 : Math.max(0, (goals.weightLbs / weightCurrent) * 100))
    ) : 0;
  const bodyFatProgress = goals.targetBodyFat > 0 && bodyFatCurrent > 0 ? 
    (bodyFatCurrent <= goals.targetBodyFat ? 100 : Math.min((goals.targetBodyFat / bodyFatCurrent) * 100, 100)) : 0;
  
  // Fix hydration progress to use actual values
  const actualHydrationProgress = actualGoalOz > 0 ? Math.min((actualCurrentOz / actualGoalOz) * 100, 100) : 0;

  // Calculate overall wellness score
  const calculateWellnessScore = (): number => {
    const totalWeight = Object.values(wellnessWeights).reduce((sum, weight) => sum + weight, 0);
    if (totalWeight === 0) return 0;

    let weightedScore = 0;
    weightedScore += (actualHydrationProgress * wellnessWeights.hydrationOz) / totalWeight;
    weightedScore += (meditationProgress * wellnessWeights.meditationMinutes) / totalWeight;
    weightedScore += (fastingProgress * wellnessWeights.fastingHours) / totalWeight;
    weightedScore += (weightProgress * wellnessWeights.weightLbs) / totalWeight;
    weightedScore += (bodyFatProgress * wellnessWeights.targetBodyFat) / totalWeight;
    weightedScore += (workoutCurrent * wellnessWeights.workoutConsistency) / totalWeight;

    return Math.round(weightedScore);
  };

  // Editing state
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [isWeightGoalTypeDialogOpen, setIsWeightGoalTypeDialogOpen] = useState(false);

  // Wellness Score State
  const [wellnessWeights, setWellnessWeights] = useState({
    hydrationOz: 10,
    meditationMinutes: 10,
    fastingHours: 10,
    weightLbs: 10,
    targetBodyFat: 20,
    workoutConsistency: 40
  });
  const [isWeightsDialogOpen, setIsWeightsDialogOpen] = useState(false);
  const [tempWeights, setTempWeights] = useState(wellnessWeights);

  // Load wellness weights from localStorage
  useEffect(() => {
    const savedWeights = localStorage.getItem('fitcircle_wellness_weights');
    if (savedWeights) {
      try {
        const parsed = JSON.parse(savedWeights);
        setWellnessWeights(parsed);
        setTempWeights(parsed);
      } catch (e) {
        console.error('Failed to parse wellness weights:', e);
      }
    }
  }, []);

  // Save wellness weights to localStorage
  const saveWellnessWeights = (weights: typeof wellnessWeights) => {
    setWellnessWeights(weights);
    localStorage.setItem('fitcircle_wellness_weights', JSON.stringify(weights));
  };

  const handleEdit = (goalKey: string, currentValue: number) => {
    setEditingGoal(goalKey);
    setTempValue(currentValue.toString());
  };

  const handleSave = (goalKey: string) => {
    const value = parseFloat(tempValue);
    if (value > 0) {
      // Special handling for meditation goal using shared utility
      if (goalKey === 'meditationMinutes') {
        setMeditationGoal(value);
      } else {
        // Update localStorage with individual goal keys
        const storageKey = `fitcircle_goal_${goalKey.replace(/([A-Z])/g, '').toLowerCase()}`;
        localStorage.setItem(storageKey, value.toString());
      }
      
      // ALSO update the fitcircle_goals object for cross-compatibility with other pages
      const existingGoals = localStorage.getItem('fitcircle_goals');
      let goalsObject = {};
      if (existingGoals) {
        try {
          goalsObject = JSON.parse(existingGoals);
        } catch (e) {
          goalsObject = {};
        }
      }
      
      // Map goal keys to fitcircle_goals object properties
      const goalKeyMap: { [key: string]: string } = {
        'weightLbs': 'targetWeight',
        'targetBodyFat': 'targetBodyFat',
        'hydrationOz': 'hydrationOz',
        'meditationMinutes': 'meditationMinutes',
        'fastingHours': 'fastingHours'
      };
      
      if (goalKeyMap[goalKey]) {
        goalsObject = {
          ...goalsObject,
          [goalKeyMap[goalKey]]: value
        };
        localStorage.setItem('fitcircle_goals', JSON.stringify(goalsObject));
      }
      
      // Update state
      setGoals(prev => ({
        ...prev,
        [goalKey]: value
      }));
    }
    setEditingGoal(null);
    setTempValue('');
  };

  const handleCancel = () => {
    setEditingGoal(null);
    setTempValue('');
  };
  
  const handleWeightGoalTypeChange = (type: 'gain' | 'lose') => {
    localStorage.setItem('fitcircle_weight_goal_type', type);
    
    // ALSO update fitcircle_goals for cross-compatibility
    const existingGoals = localStorage.getItem('fitcircle_goals');
    let goalsObject = {};
    if (existingGoals) {
      try {
        goalsObject = JSON.parse(existingGoals);
      } catch (e) {
        goalsObject = {};
      }
    }
    goalsObject = {
      ...goalsObject,
      weightGoalType: type
    };
    localStorage.setItem('fitcircle_goals', JSON.stringify(goalsObject));
    
    setGoals(prev => ({
      ...prev,
      weightGoalType: type
    }));
    setIsWeightGoalTypeDialogOpen(false);
  };

  // Define goal items using working pattern
  const goalItems = [
    {
      key: 'hydrationOz',
      title: 'Daily Hydration',
      unit: 'oz',
      icon: Droplet,
      color: 'rgb(59, 130, 246)',
      currentValue: Math.round(actualCurrentOz),
      goalValue: actualGoalOz,
      progress: actualHydrationProgress
    },
    {
      key: 'meditationMinutes',
      title: 'Daily Meditation',
      unit: 'min',
      icon: Brain,
      color: 'rgb(147, 51, 234)',
      currentValue: meditationCurrent,
      goalValue: getMeditationGoal(),
      progress: meditationProgress
    },
    {
      key: 'fastingHours',
      title: 'Intermittent Fasting',
      unit: 'hrs',
      icon: Clock,
      color: 'rgb(245, 158, 11)',
      currentValue: fastingCurrent,
      goalValue: goals.fastingHours,
      progress: fastingProgress
    },
    {
      key: 'weightLbs',
      title: 'Target Weight',
      unit: 'lbs',
      icon: Scale,
      color: 'rgb(34, 197, 94)',
      currentValue: weightCurrent,
      goalValue: goals.weightLbs,
      progress: weightProgress,
      hasSpecialEdit: true // Weight has special goal type setting
    },
    {
      key: 'targetBodyFat',
      title: 'Target Body Fat',
      unit: '%',
      icon: Percent,
      color: 'rgb(239, 68, 68)',
      currentValue: bodyFatCurrent,
      goalValue: goals.targetBodyFat,
      progress: bodyFatProgress
    },
    {
      key: 'workoutConsistency',
      title: 'Workout Consistency',
      unit: '%',
      icon: Target,
      color: 'rgb(16, 185, 129)',
      currentValue: workoutCurrent,
      goalValue: 100,
      progress: workoutCurrent
    }
  ];

  return (
    <div className="min-h-screen text-white pb-32" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-slate-300 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h1 className="text-xl font-semibold">Goals</h1>
        <div className="w-16"></div>
      </div>

      <div className="p-4 space-y-6">
        {/* Goals Grid */}
        <div className="grid grid-cols-2 gap-4">
          {goalItems.map((item) => {
            const IconComponent = item.icon;
            const isEditing = editingGoal === item.key;
            
            return (
              <div key={item.key} className="bg-slate-800 rounded-xl p-4 relative">
                {/* Goal Circle using same pattern as test */}
                <div className="flex flex-col items-center mb-4">
                  <GoalCircle
                    percentage={Math.min(item.progress || 0, 100)}
                    color={item.color}
                    size={100}
                    currentValue={item.currentValue}
                    goalValue={item.goalValue}
                    unit={item.unit}
                    title=""
                    description=""
                  />
                </div>

                {/* Title with icon */}
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <IconComponent className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-medium text-white text-center">{item.title}</h3>
                </div>

                {/* Edit button in top right corner */}
                <div className="absolute top-2 right-2">
                  {isEditing ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="w-16 px-2 py-1 text-xs bg-slate-700 text-white rounded border border-slate-600"
                        step={item.key === 'fastingHours' ? "0.1" : "1"}
                      />
                      <button
                        onClick={() => handleSave(item.key)}
                        className="p-1 text-green-400 hover:text-green-300"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-1 text-red-400 hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => item.hasSpecialEdit && item.key === 'weightLbs' ? 
                        setIsWeightGoalTypeDialogOpen(true) : 
                        handleEdit(item.key, item.goalValue)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Wellness Score Section */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Overall Wellness Score</h2>
            <button
              onClick={() => setIsWeightsDialogOpen(true)}
              className="text-slate-400 hover:text-white"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex flex-col items-center">
            <GoalCircle
              percentage={calculateWellnessScore()}
              color="rgb(34, 197, 94)"
              size={140}
              currentValue={calculateWellnessScore()}
              goalValue={100}
              unit=""
              title="Wellness Score"
              description="Based on your goal progress and priority weights"
            />
          </div>
        </div>
      </div>

      {/* Wellness Weights Dialog */}
      {isWeightsDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Customize Priority Weights</h3>
            
            <div className="space-y-4 mb-6">
              {Object.entries(tempWeights).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm text-slate-300 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(e) => setTempWeights({
                        ...tempWeights,
                        [key]: parseInt(e.target.value) || 0
                      })}
                      className="w-16 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-white text-sm text-center"
                    />
                    <span className="text-sm text-slate-400">%</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  saveWellnessWeights(tempWeights);
                  setIsWeightsDialogOpen(false);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setTempWeights(wellnessWeights);
                  setIsWeightsDialogOpen(false);
                }}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weight Goal Type Dialog */}
      {isWeightGoalTypeDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Weight Goal Setting</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex flex-col space-y-3">
                <label className="text-sm text-slate-300">Goal Type:</label>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleWeightGoalTypeChange('lose')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-colors ${
                      goals.weightGoalType === 'lose' 
                        ? 'border-green-500 bg-green-500/20 text-green-400' 
                        : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    Lose Weight
                  </button>
                  <button
                    onClick={() => handleWeightGoalTypeChange('gain')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-colors ${
                      goals.weightGoalType === 'gain' 
                        ? 'border-green-500 bg-green-500/20 text-green-400' 
                        : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    Gain Weight
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <label className="text-sm text-slate-300">Target Weight (lbs):</label>
                <input
                  type="number"
                  value={goals.weightLbs}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (value > 0) {
                      localStorage.setItem('fitcircle_goal_weight', value.toString());
                      setGoals(prev => ({ ...prev, weightLbs: value }));
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-xl border border-slate-600 focus:border-green-500"
                  step="0.1"
                />
              </div>
              
              <div className="text-xs text-slate-400 bg-slate-700 rounded-xl p-3">
                <strong>Current:</strong> {weightCurrent}lbs<br/>
                <strong>Target:</strong> {goals.weightLbs}lbs ({goals.weightGoalType === 'lose' ? 'Lose' : 'Gain'} {Math.abs(weightCurrent - goals.weightLbs).toFixed(1)}lbs)
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setIsWeightGoalTypeDialogOpen(false)}
                className="flex-1 py-2 px-4 bg-slate-700 text-white rounded-xl hover:bg-slate-600"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}