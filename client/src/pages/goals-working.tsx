import { useState, useEffect } from 'react';
import { ChevronLeft, Droplet, Brain, Clock, Scale, Percent, Target, Edit3, Check, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { useGoals } from '@/hooks/use-goals';
import { useWorkouts } from '@/hooks/use-workouts';
import { useMeasurements } from '@/hooks/use-measurements';
import { GoalCircle } from '@/components/GoalCircle';

type WellnessWeights = {
  hydrationOz: number;
  meditationMinutes: number;
  fastingHours: number;
  weightLbs: number;
  targetBodyFat: number;
  workoutConsistency: number;
};

export default function GoalsPage() {
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

  const { goals, updateGoal, calculateProgress } = useGoals();
  const { getTotalStats } = useWorkouts();
  const { getLatestValue } = useMeasurements();
  
  // Progress state
  const [progress, setProgress] = useState({
    hydrationProgress: 0,
    meditationProgress: 0,
    fastingProgress: 0,
    weightProgress: 0,
    targetWeightProgress: 0,
    targetBodyFatProgress: 0,
    workoutConsistencyProgress: 0
  });
  
  // Force update goals when data changes
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    const updateProgress = async () => {
      const newProgress = await calculateProgress();
      setProgress(newProgress);
    };
    
    updateProgress();
    
    const interval = setInterval(() => {
      updateProgress();
      setRefreshKey(prev => prev + 1);
    }, 1000); // Update every second for real-time progress
    
    return () => clearInterval(interval);
  }, [calculateProgress]);
  
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState(goals);

  // Wellness Score State
  const [wellnessWeights, setWellnessWeights] = useState<WellnessWeights>({
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
      } catch (e) {
        console.error('Failed to parse wellness weights:', e);
      }
    }
  }, []);

  // Save wellness weights to localStorage
  const saveWellnessWeights = (weights: WellnessWeights) => {
    setWellnessWeights(weights);
    localStorage.setItem('fitcircle_wellness_weights', JSON.stringify(weights));
  };

  const handleEdit = (goalType: string) => {
    setEditingGoal(goalType);
    setTempValues(goals);
  };

  const handleSave = (goalType: keyof typeof goals) => {
    updateGoal(goalType, tempValues[goalType]);
    setEditingGoal(null);
  };

  const handleCancel = () => {
    setTempValues(goals);
    setEditingGoal(null);
  };

  // Helper functions for current values - using the same logic as the working modals
  const getCurrentHydration = () => {
    const hydrationData = localStorage.getItem('fitcircle_hydration_data');
    if (hydrationData) {
      try {
        const parsed = JSON.parse(hydrationData);
        return Math.round(parsed.currentDayOz || 0);
      } catch (e) {
        return 0;
      }
    }
    return 0;
  };

  const getCurrentMeditation = () => {
    const meditationLogs = localStorage.getItem('fitcircle_meditation_logs');
    if (meditationLogs) {
      try {
        const logs = JSON.parse(meditationLogs);
        const last7Days = logs.slice(-7);
        const totalMinutes = last7Days.reduce((sum: number, session: any) => sum + session.duration, 0);
        return Math.round(totalMinutes / Math.max(last7Days.length, 1));
      } catch (e) {
        return 0;
      }
    }
    return 0;
  };

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
            } else if (log?.duration) {
              const durationHours = log.duration / 60;
              if (durationHours > 0 && durationHours < 48) {
                completedFasts.push(durationHours);
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

  // Define goal items using the same pattern as the working modals
  const goalItems = [
    {
      key: 'hydrationOz' as keyof typeof goals,
      title: 'Daily Hydration',
      unit: 'oz',
      icon: Droplet,
      description: 'Daily water intake goal',
      progress: progress.hydrationProgress,
      color: 'rgb(59, 130, 246)', // blue
      currentValue: getCurrentHydration(),
      goalValue: goals.hydrationOz
    },
    {
      key: 'meditationMinutes' as keyof typeof goals,
      title: 'Daily Meditation',
      unit: 'min',
      icon: Brain,
      description: '7-day average meditation time',
      progress: progress.meditationProgress,
      color: 'rgb(147, 51, 234)', // purple
      currentValue: getCurrentMeditation(),
      goalValue: goals.meditationMinutes
    },
    {
      key: 'fastingHours' as keyof typeof goals,
      title: 'Intermittent Fasting',
      unit: 'hrs',
      icon: Clock,
      description: 'All-time average fasting duration',
      progress: progress.fastingProgress,
      color: 'rgb(245, 158, 11)', // amber
      currentValue: getCurrentFasting(),
      goalValue: goals.fastingHours
    },
    {
      key: 'weightLbs' as keyof typeof goals,
      title: 'Target Weight',
      unit: 'lbs',
      icon: Scale,
      description: 'Current weight vs target',
      progress: progress.weightProgress,
      color: 'rgb(34, 197, 94)', // green
      currentValue: getCurrentWeight(),
      goalValue: goals.weightLbs
    },
    {
      key: 'targetBodyFat' as keyof typeof goals,
      title: 'Target Body Fat',
      unit: '%',
      icon: Percent,
      description: 'Current body fat vs target',
      progress: progress.targetBodyFatProgress,
      color: 'rgb(239, 68, 68)', // red
      currentValue: getLatestValue('bodyFat') || 0,
      goalValue: goals.targetBodyFat
    },
    {
      key: 'workoutConsistency' as keyof typeof goals,
      title: 'Workout Consistency',
      unit: '%',
      icon: Target,
      description: 'Overall workout goal completion',
      progress: progress.workoutConsistencyProgress,
      color: 'rgb(16, 185, 129)', // emerald
      currentValue: Math.round((getTotalStats().totalGoalPercentage || 0) * 10) / 10,
      goalValue: 100
    }
  ];

  // Calculate overall wellness score
  const calculateWellnessScore = (): number => {
    const totalWeight = Object.values(wellnessWeights).reduce((sum, weight) => sum + weight, 0);
    if (totalWeight === 0) return 0;

    let weightedScore = 0;
    weightedScore += (progress.hydrationProgress * wellnessWeights.hydrationOz) / totalWeight;
    weightedScore += (progress.meditationProgress * wellnessWeights.meditationMinutes) / totalWeight;
    weightedScore += (progress.fastingProgress * wellnessWeights.fastingHours) / totalWeight;
    weightedScore += (progress.weightProgress * wellnessWeights.weightLbs) / totalWeight;
    
    // Target body fat progress calculation
    const currentBodyFat = getLatestValue('bodyFat') || 0;
    const targetBodyFat = goals.targetBodyFat || 0;
    let bodyFatProgress = 0;
    if (targetBodyFat > 0 && currentBodyFat > 0) {
      if (currentBodyFat <= targetBodyFat) {
        bodyFatProgress = 100;
      } else {
        bodyFatProgress = Math.min(100, (targetBodyFat / currentBodyFat) * 100);
      }
    }
    weightedScore += (bodyFatProgress * wellnessWeights.targetBodyFat) / totalWeight;
    
    // Workout consistency from total stats
    const workoutConsistency = getTotalStats().totalGoalPercentage || 0;
    weightedScore += (workoutConsistency * wellnessWeights.workoutConsistency) / totalWeight;

    return Math.round(weightedScore);
  };

  const wellnessScore = calculateWellnessScore();

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
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
        {/* Goals Grid using GoalCircle component like the working modals */}
        <div className="grid grid-cols-2 gap-4">
          {goalItems.map((item) => {
            const IconComponent = item.icon;
            const isEditing = editingGoal === item.key;
            
            return (
              <div key={item.key} className="bg-slate-800 rounded-xl p-4 relative">
                {/* Using GoalCircle component same as working modals */}
                <div className="flex flex-col items-center mb-4">
                  <GoalCircle
                    percentage={Math.min(item.progress || 0, 100)}
                    color={item.color}
                    size={100}
                    currentValue={item.currentValue}
                    goalValue={item.goalValue}
                    unit={item.unit}
                    title={item.title}
                    description={item.description}
                  />
                </div>

                {/* Goal editing section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Goal:</span>
                    <div className="flex items-center space-x-2">
                      {isEditing ? (
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            value={tempValues[item.key]}
                            onChange={(e) => setTempValues({
                              ...tempValues,
                              [item.key]: parseFloat(e.target.value) || 0
                            })}
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
                        <div className="flex items-center space-x-1">
                          <span className="text-sm font-medium">{goals[item.key]}{item.unit}</span>
                          <button
                            onClick={() => handleEdit(item.key)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
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
              onClick={() => {
                setTempWeights(wellnessWeights);
                setIsWeightsDialogOpen(true);
              }}
              className="text-slate-400 hover:text-white"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex flex-col items-center">
            <GoalCircle
              percentage={wellnessScore}
              color="rgb(34, 197, 94)"
              size={140}
              currentValue={wellnessScore}
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
                  <span className="text-sm text-slate-300 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={value}
                      onChange={(e) => setTempWeights({
                        ...tempWeights,
                        [key]: parseInt(e.target.value)
                      })}
                      className="w-20"
                    />
                    <span className="text-sm font-medium w-8 text-right">{value}%</span>
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
    </div>
  );
}