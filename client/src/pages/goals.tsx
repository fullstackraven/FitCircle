import { useState, useEffect } from 'react';
import { ChevronLeft, Droplet, Brain, Clock, Scale, Edit, Percent, Target, TrendingUp, Settings } from 'lucide-react';
import { useLocation } from 'wouter';
import { useGoals } from '@/hooks/use-goals';
import { useWorkouts } from '@/hooks/use-workouts';
import { useMeasurements } from '@/hooks/use-measurements';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Circular Progress Component
interface CircularProgressProps {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

function CircularProgress({ percentage, color, size = 120, strokeWidth = 8, children }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(71, 85, 105)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// Wellness score weights interface
interface WellnessWeights {
  hydrationOz: number;
  meditationMinutes: number;
  fastingHours: number;
  weightLbs: number;
  targetBodyFat: number;
  workoutConsistency: number;
}

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

  const { goals, updateGoal, progress } = useGoals();
  const { getTotalStats } = useWorkouts();
  const { getLatestValue } = useMeasurements();
  
  // Force update goals when data changes
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 1000); // Update every second for real-time progress
    
    return () => clearInterval(interval);
  }, []);
  
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

  const goalItems = [
    {
      key: 'hydrationOz' as keyof typeof goals,
      title: 'Daily Hydration',
      unit: 'oz',
      icon: Droplet,
      description: 'Daily water intake goal',
      progress: progress.hydrationProgress,
      color: 'rgb(59, 130, 246)', // blue
      currentValue: (() => {
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
      })()
    },
    {
      key: 'meditationMinutes' as keyof typeof goals,
      title: 'Daily Meditation',
      unit: 'min',
      icon: Brain,
      description: '7-day average meditation time',
      progress: progress.meditationProgress,
      color: 'rgb(147, 51, 234)', // purple
      currentValue: (() => {
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
      })()
    },
    {
      key: 'fastingHours' as keyof typeof goals,
      title: 'Intermittent Fasting',
      unit: 'hrs',
      icon: Clock,
      description: 'All-time average fasting duration',
      progress: progress.fastingProgress,
      color: 'rgb(245, 158, 11)', // amber
      currentValue: (() => {
        const fastingLogs = localStorage.getItem('fitcircle_fasting_logs');
        if (fastingLogs) {
          try {
            const logs = JSON.parse(fastingLogs);
            const completedFasts: number[] = [];
            
            // The logs are stored as an array, not an object keyed by date
            if (Array.isArray(logs)) {
              logs.forEach((log: any) => {
                if (log?.endDate && log?.startDate && log?.endTime && log?.startTime) {
                  // Combine date and time for proper parsing
                  const start = new Date(`${log.startDate}T${log.startTime}`);
                  const end = new Date(`${log.endDate}T${log.endTime}`);
                  const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  if (duration > 0 && duration < 48) { // Sanity check: ignore sessions longer than 48 hours
                    completedFasts.push(duration);
                  }
                } else if (log?.duration) {
                  // Fallback: use duration field if available (stored in minutes)
                  const durationHours = log.duration / 60;
                  if (durationHours > 0 && durationHours < 48) {
                    completedFasts.push(durationHours);
                  }
                }
              });
            }
            
            if (completedFasts.length > 0) {
              // Calculate all-time average
              const averageHours = completedFasts.reduce((sum, hours) => sum + hours, 0) / completedFasts.length;
              return Math.round(averageHours * 10) / 10;
            }
          } catch (e) {
            return 0;
          }
        }
        return 0;
      })()
    },
    {
      key: 'weightLbs' as keyof typeof goals,
      title: 'Target Weight',
      unit: 'lbs',
      icon: Scale,
      description: 'Current weight vs target',
      progress: progress.weightProgress,
      color: 'rgb(34, 197, 94)', // green
      currentValue: (() => {
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
      })()
    },
    {
      key: 'targetBodyFat' as keyof typeof goals,
      title: 'Target Body Fat',
      unit: '%',
      icon: Percent,
      description: 'Current body fat vs target',
      progress: (() => {
        const currentBodyFat = getLatestValue('bodyFat') || 0;
        const targetBodyFat = goals.targetBodyFat || 0;
        if (targetBodyFat === 0) return 0;
        
        // Calculate progress - closer to target = higher percentage
        // If current is higher than target, show progress as (target/current * 100)
        // If current is lower than target, show 100%
        if (currentBodyFat === 0) return 0;
        if (currentBodyFat <= targetBodyFat) return 100;
        return Math.min(100, (targetBodyFat / currentBodyFat) * 100);
      })(),
      color: 'rgb(239, 68, 68)', // red
      currentValue: getLatestValue('bodyFat') || 0
    },
    {
      key: 'workoutConsistency' as keyof typeof goals,
      title: 'Workout Consistency',
      unit: '%',
      icon: Target,
      description: 'Overall workout goal completion',
      progress: (() => {
        const totalStats = getTotalStats();
        return totalStats.totalGoalPercentage || 0;
      })(),
      color: 'rgb(16, 185, 129)', // emerald
      currentValue: Math.round((getTotalStats().totalGoalPercentage || 0) * 10) / 10
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
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-semibold">Goals</h1>
          <div className="w-16"></div>
        </div>

        {/* Goals Grid - 2x2 layout */}
        <div className="grid grid-cols-2 gap-4">
          {goalItems.map((item) => {
            const IconComponent = item.icon;
            const isEditing = editingGoal === item.key;
            const displayValue = goals[item.key];
            
            return (
              <div key={item.key} className="bg-slate-800 rounded-xl p-4 relative">
                {/* Edit Button */}
                <button
                  onClick={() => handleEdit(item.key)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>

                {/* Circular Progress */}
                <div className="flex flex-col items-center mb-4">
                  <CircularProgress
                    percentage={Math.min(item.progress, 100)}
                    color={item.color}
                    size={100}
                    strokeWidth={6}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        {displayValue}
                        <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {Math.round(item.progress)}%
                      </div>
                    </div>
                  </CircularProgress>
                </div>

                {/* Title with Icon */}
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <IconComponent className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-medium text-white text-center">{item.title}</h3>
                </div>

                {/* Edit Modal */}
                {isEditing && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm">
                      <h3 className="text-lg font-semibold mb-4">Edit {item.title}</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={item.key} className="text-slate-300">
                            Goal ({item.unit})
                          </Label>
                          <Input
                            id={item.key}
                            type="number"
                            value={tempValues[item.key]}
                            onChange={(e) => setTempValues(prev => ({
                              ...prev,
                              [item.key]: parseFloat(e.target.value) || 0
                            }))}
                            className="bg-slate-700 border-slate-600 text-white mt-1"
                          />
                        </div>
                        <div className="flex space-x-3">
                          <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleSave(item.key)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Description */}
        <div className="mt-6 text-center text-slate-400 text-sm">
          Track your daily wellness goals with visual progress indicators
        </div>

        {/* Overall Wellness Score Section */}
        <div className="mt-8 bg-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Wellness Score</h2>
            </div>
            <Dialog open={isWeightsDialogOpen} onOpenChange={setIsWeightsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => setTempWeights(wellnessWeights)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white">Wellness Score Priorities</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="text-sm text-slate-400 mb-4">
                    Adjust the importance of each goal in your overall wellness score. Higher percentages have more impact.
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { key: 'workoutConsistency' as keyof WellnessWeights, label: 'Workout Consistency', icon: Target },
                      { key: 'targetBodyFat' as keyof WellnessWeights, label: 'Target Body Fat', icon: Percent },
                      { key: 'hydrationOz' as keyof WellnessWeights, label: 'Daily Hydration', icon: Droplet },
                      { key: 'meditationMinutes' as keyof WellnessWeights, label: 'Daily Meditation', icon: Brain },
                      { key: 'fastingHours' as keyof WellnessWeights, label: 'Intermittent Fasting', icon: Clock },
                      { key: 'weightLbs' as keyof WellnessWeights, label: 'Target Weight', icon: Scale }
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <item.icon className="w-4 h-4 text-slate-400" />
                          <Label className="text-sm text-slate-300">{item.label}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={tempWeights[item.key]}
                            onChange={(e) => setTempWeights(prev => ({
                              ...prev,
                              [item.key]: parseInt(e.target.value) || 0
                            }))}
                            className="w-16 h-8 text-center bg-slate-700 border-slate-600 text-white"
                          />
                          <span className="text-xs text-slate-400">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-xs text-slate-500 mt-4">
                    Total: {Object.values(tempWeights).reduce((sum, val) => sum + val, 0)}% 
                    {Object.values(tempWeights).reduce((sum, val) => sum + val, 0) !== 100 && 
                      " (doesn't need to equal 100%)"
                    }
                  </div>
                  
                  <div className="flex space-x-2 pt-4">
                    <Button
                      onClick={() => {
                        saveWellnessWeights(tempWeights);
                        setIsWeightsDialogOpen(false);
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Save Priorities
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTempWeights(wellnessWeights);
                        setIsWeightsDialogOpen(false);
                      }}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex justify-center">
            <CircularProgress
              percentage={wellnessScore}
              color="rgb(16, 185, 129)" // emerald
              size={160}
              strokeWidth={12}
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  {wellnessScore}
                  <span className="text-lg text-slate-400"></span>
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  
                </div>
              </div>
            </CircularProgress>
          </div>
          
          <div className="text-center mt-4">
            <div className="text-sm text-slate-400">
              Weighted average based on your personal priorities
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}