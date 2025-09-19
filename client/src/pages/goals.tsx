import { useState, useEffect } from 'react';
import { ArrowLeft, Droplet, Brain, Clock, Scale, Percent, Target, Activity, Heart } from 'lucide-react';
import { useLocation } from 'wouter';
import { useHydration } from '@/hooks/use-hydration';
import { useWorkouts } from '@/hooks/use-workouts';
import { useCardio } from '@/hooks/use-cardio';
import { useRecovery } from '@/hooks/use-recovery';
import { useMeditation } from '@/hooks/use-meditation';
import { useFasting } from '@/hooks/use-fasting';
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
      sessionStorage.setItem('fitcircle_dashboard_open', 'true');
      navigate('/');
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

  // Get current values directly from each page's hook functions (single source of truth)
  const { currentDayOz, dailyGoalOz, progressPercentage: hydrationProgress } = useHydration();
  const { getProgressPercentage: getMeditationProgress } = useMeditation();
  const { getAllTimeGoalPercentage: getFastingProgress } = useFasting();
  const { getWeeklyProgress: getCardioWeeklyProgress } = useCardio();
  
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
    return Math.round(stats.totalConsistency || 0);
  };

  // Calculate progress percentages
  const fastingCurrent = getCurrentFasting();
  const weightCurrent = getCurrentWeight();
  const bodyFatCurrent = getCurrentBodyFat();
  const workoutCurrent = getWorkoutConsistency();

  // Get cardio data
  const { getLast7DaysAverage, getWeeklyProgress, updateGoal, data: cardioData } = useCardio();
  const cardio7DayAverage = getLast7DaysAverage();
  const cardioWeeklyProgress = getWeeklyProgress(); // Use same calculation as cardio page

  // Get recovery data
  const { getRecoveryStats } = useRecovery();
  const recoveryStats = getRecoveryStats();
  const recoveryPercentage = recoveryStats.recoveryPercentage;

  // Note: Cardio goal now updates directly through cardio hook, no separate form state needed

  // Use hook functions directly (single source of truth)
  const meditationProgress = getMeditationProgress();
  const fastingProgress = getFastingProgress();
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
    weightedScore += (cardioWeeklyProgress.goalProgress * wellnessWeights.cardio) / totalWeight;
    weightedScore += (recoveryPercentage * wellnessWeights.recovery) / totalWeight;

    return Math.round(weightedScore);
  };

  // Goals page is now read-only - removed all editing state

  // Wellness Score State
  const [wellnessWeights, setWellnessWeights] = useState({
    hydrationOz: 20,
    meditationMinutes: 10,
    fastingHours: 10,
    weightLbs: 10,
    targetBodyFat: 10,
    workoutConsistency: 30,
    cardio: 10,
    recovery: 0 // Start with 0% weight as requested
  });

  // Goal ring colors state
  const [goalColors, setGoalColors] = useState({
    hydrationOz: 'rgb(59, 130, 246)',
    meditationMinutes: 'rgb(168, 85, 247)',
    fastingHours: 'rgb(251, 146, 60)',
    weightLbs: 'rgb(34, 197, 94)',
    targetBodyFat: 'rgb(239, 68, 68)',
    workoutConsistency: 'rgb(147, 51, 234)',
    cardio: 'rgb(59, 130, 246)',
    recovery: 'rgb(251, 146, 60)' // Orange color for recovery
  });

  // Available color options
  const colorOptions = [
    { name: 'Blue', value: 'rgb(59, 130, 246)' },
    { name: 'Green', value: 'rgb(34, 197, 94)' },
    { name: 'Purple', value: 'rgb(147, 51, 234)' },
    { name: 'Pink', value: 'rgb(236, 72, 153)' },
    { name: 'Yellow', value: 'rgb(234, 179, 8)' },
    { name: 'Red', value: 'rgb(239, 68, 68)' },
    { name: 'Orange', value: 'rgb(251, 146, 60)' },
    { name: 'Indigo', value: 'rgb(99, 102, 241)' },
    { name: 'Teal', value: 'rgb(20, 184, 166)' },
    { name: 'Cyan', value: 'rgb(6, 182, 212)' },
    { name: 'Lime', value: 'rgb(132, 204, 22)' },
    { name: 'Emerald', value: 'rgb(16, 185, 129)' }
  ];
  // Removed wellness weights editing state - Goals page is read-only

  // Load wellness weights and goal colors from localStorage
  useEffect(() => {
    const savedWeights = localStorage.getItem('fitcircle_wellness_weights');
    if (savedWeights) {
      try {
        const parsed = JSON.parse(savedWeights);
        // Ensure cardio and recovery are included if missing from saved data
        const updatedWeights = {
          hydrationOz: 20,
          meditationMinutes: 10,
          fastingHours: 10,
          weightLbs: 10,
          targetBodyFat: 10,
          workoutConsistency: 30,
          cardio: 10,
          recovery: 0, // Default recovery weight to 0%
          ...parsed
        };
        setWellnessWeights(updatedWeights);
        setTempWeights(updatedWeights);
      } catch (e) {
        console.error('Failed to parse wellness weights:', e);
      }
    }

    const savedColors = localStorage.getItem('fitcircle_goal_colors');
    if (savedColors) {
      try {
        const parsed = JSON.parse(savedColors);
        setGoalColors(parsed);
      } catch (e) {
        console.error('Failed to parse goal colors:', e);
      }
    }
  }, []);

  // Save wellness weights to localStorage
  const saveWellnessWeights = (weights: typeof wellnessWeights) => {
    setWellnessWeights(weights);
    localStorage.setItem('fitcircle_wellness_weights', JSON.stringify(weights));
  };

  // Save goal colors to localStorage
  const saveGoalColors = (colors: typeof goalColors) => {
    setGoalColors(colors);
    localStorage.setItem('fitcircle_goal_colors', JSON.stringify(colors));
  };

  // Color changing removed - Goals page is read-only

  // Edit function removed - Goals page is read-only

  // Save function removed - Goals page is read-only

  // Cancel function removed - Goals page is read-only
  
  // Weight goal type change function removed - Goals page is read-only



  // Define goal items using working pattern
  const goalItems = [
    {
      key: 'hydrationOz',
      title: 'Daily Hydration',
      unit: 'oz',
      icon: Droplet,
      color: goalColors.hydrationOz,
      currentValue: Math.round(actualCurrentOz),
      goalValue: actualGoalOz,
      progress: actualHydrationProgress
    },
    {
      key: 'meditationMinutes',
      title: 'Daily Meditation',
      unit: 'min',
      icon: Brain,
      color: goalColors.meditationMinutes,
      currentValue: meditationCurrent,
      goalValue: getMeditationGoal(),
      progress: meditationProgress
    },
    {
      key: 'fastingHours',
      title: 'Intermittent Fasting',
      unit: 'hrs',
      icon: Clock,
      color: goalColors.fastingHours,
      currentValue: fastingCurrent,
      goalValue: goals.fastingHours,
      progress: fastingProgress
    },
    {
      key: 'weightLbs',
      title: 'Target Weight',
      unit: 'lbs',
      icon: Scale,
      color: goalColors.weightLbs,
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
      color: goalColors.targetBodyFat,
      currentValue: bodyFatCurrent,
      goalValue: goals.targetBodyFat,
      progress: bodyFatProgress
    },
    {
      key: 'workoutConsistency',
      title: 'Workout Consistency',
      unit: '%',
      icon: Target,
      color: goalColors.workoutConsistency,
      currentValue: workoutCurrent,
      goalValue: 100,
      progress: workoutCurrent
    },
    {
      key: 'cardio',
      title: 'Cardio Goal',
      unit: cardioData.goal.type === 'duration' ? 'min' : 'mi',
      icon: Activity,
      color: goalColors.cardio,
      currentValue: Math.round(cardio7DayAverage.average * 10) / 10,
      goalValue: cardioData.goal.target,
      progress: cardioWeeklyProgress.goalProgress || 0
    },
    {
      key: 'recovery',
      title: 'Recovery Rate',
      unit: '%',
      icon: Heart,
      color: goalColors.recovery,
      currentValue: Math.round(recoveryPercentage * 10) / 10,
      goalValue: 100, // Recovery is percentage-based, so goal is 100%
      progress: recoveryPercentage,
      isReadOnly: true // Recovery is calculated automatically, no manual goal setting
    }
  ];

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
          <h1 className="fitcircle-page-title">Goals</h1>
          <div className="w-16"></div>
        </div>

        <div className="space-y-6">
          {/* Wellness Score Section - Moved to top */}
          <div className="fitcircle-card-lg">
          <div className="flex items-center justify-center mb-4">
            <h2 className="text-lg font-semibold">Overall Wellness Score</h2>
          </div>
          
          <div className="flex flex-col items-center">
            <GoalCircle
              percentage={calculateWellnessScore()}
              color="rgb(34, 197, 94)"
              size={160}
              strokeWidth={10}
              currentValue={calculateWellnessScore()}
              goalValue={100}
              unit=""
              title="Wellness Score"
              description="Based on your goal progress and priority weights"
            />
          </div>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-2 gap-4">
          {goalItems.map((item) => {
            const IconComponent = item.icon;
            // Read-only display - no editing state needed
            
            return (
              <div key={item.key} className="bg-slate-800 rounded-xl p-4 relative">
                {/* Goal Circle using same pattern as test */}
                <div className="flex flex-col items-center mb-4">
                  <GoalCircle
                    percentage={Math.min(item.progress || 0, 100)}
                    color={item.color}
                    size={120}
                    strokeWidth={10}
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

                {/* Read-only display - no editing buttons */}
              </div>
            );
          })}
        </div>


      </div>

      {/* All editing modals removed - Goals page is read-only */}



      {/* All editing modals have been removed - Goals page is now completely read-only */}
      </div>
    </div>
  );
}