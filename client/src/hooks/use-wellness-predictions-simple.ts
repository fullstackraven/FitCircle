import { useState, useEffect } from 'react';
import { wellnessPredictor, WellnessDataPoint, WellnessPredictions } from '@/utils/mlPredictor';
import { useWorkouts } from '@/hooks/use-workouts';

// Simple approach - copy EXACTLY what Goals page does
export const useWellnessPredictionsSimple = () => {
  const [predictions, setPredictions] = useState<WellnessPredictions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use same hooks as Goals page
  const { getDailyLogs, getTotalStats } = useWorkouts();

  // Copy EXACT calculation logic from Goals page
  const getWorkoutData = () => {
    const dailyLogs = getDailyLogs() || {};
    console.log('WORKOUT DAILY LOGS:', Object.keys(dailyLogs).length, 'days');
    return dailyLogs;
  };

  const getMeditationMinutes = () => {
    // EXACT copy from Goals page lines 142-174
    const meditationLogs = localStorage.getItem('fitcircle_meditation_logs');
    if (meditationLogs) {
      try {
        const logs = JSON.parse(meditationLogs);
        console.log('MEDITATION LOGS:', logs.length, 'sessions');
        
        // Group by date like Goals does
        const dailyTotals: { [date: string]: number } = {};
        
        if (Array.isArray(logs)) {
          logs.forEach((session: any) => {
            const sessionDate = new Date(session.completedAt || session.date);
            const dateKey = sessionDate.toISOString().split('T')[0];
            dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + (session.duration || 0);
          });
        }
        
        console.log('MEDITATION BY DATE:', Object.keys(dailyTotals).length, 'days');
        return dailyTotals;
      } catch (e) {
        console.error('Error parsing meditation logs:', e);
        return {};
      }
    }
    return {};
  };

  const getFastingHours = () => {
    // EXACT copy from Goals page lines 165-202
    const fastingLogs = localStorage.getItem('fitcircle_fasting_logs');
    if (fastingLogs) {
      try {
        const logs = JSON.parse(fastingLogs);
        console.log('FASTING LOGS:', logs.length, 'sessions');
        
        const dailyTotals: { [date: string]: number } = {};
        
        if (Array.isArray(logs)) {
          logs.forEach((log: any) => {
            let durationHours = 0;
            let dateKey = '';
            
            if (log?.endDate && log?.startDate && log?.endTime && log?.startTime) {
              // Use start date as the key
              dateKey = log.startDate;
              const start = new Date(`${log.startDate}T${log.startTime}`);
              const end = new Date(`${log.endDate}T${log.endTime}`);
              durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            } else if (log?.duration && log?.startDate) {
              dateKey = log.startDate;
              durationHours = log.duration / 60; // Convert minutes to hours
            }
            
            if (dateKey && durationHours > 0 && durationHours < 48) {
              dailyTotals[dateKey] = Math.max(dailyTotals[dateKey] || 0, durationHours); // Take max if multiple sessions
            }
          });
        }
        
        console.log('FASTING BY DATE:', Object.keys(dailyTotals).length, 'days');
        return dailyTotals;
      } catch (e) {
        console.error('Error parsing fasting logs:', e);
        return {};
      }
    }
    return {};
  };

  const getHydrationData = () => {
    // EXACT copy from Goals page lines 120-125
    const hydrationData = localStorage.getItem('fitcircle_hydration_data');
    if (hydrationData) {
      try {
        const parsed = JSON.parse(hydrationData);
        const logs = parsed.logs || {};
        console.log('HYDRATION LOGS:', Object.keys(logs).length, 'days');
        return logs;
      } catch (e) {
        console.error('Error parsing hydration data:', e);
        return {};
      }
    }
    return {};
  };

  const getEnergyData = () => {
    // Direct localStorage access like Goals page
    const energyData = localStorage.getItem('fitcircle_energy_levels');
    if (energyData) {
      try {
        const parsed = JSON.parse(energyData);
        console.log('ENERGY DATA:', Object.keys(parsed).length, 'days');
        return parsed;
      } catch (e) {
        console.error('Error parsing energy data:', e);
        return {};
      }
    }
    return {};
  };

  // Aggregate wellness data using Goals page approach
  const aggregateWellnessData = (): WellnessDataPoint[] => {
    try {
      console.log('=== USING GOALS PAGE APPROACH ===');
      
      // Get all data using exact Goals page methods
      const workoutDailyLogs = getWorkoutData();
      const meditationByDate = getMeditationMinutes();
      const fastingByDate = getFastingHours();
      const hydrationLogs = getHydrationData();
      const energyData = getEnergyData();

      // Get all unique dates
      const allDates = new Set([
        ...Object.keys(workoutDailyLogs),
        ...Object.keys(meditationByDate),
        ...Object.keys(fastingByDate),
        ...Object.keys(hydrationLogs),
        ...Object.keys(energyData)
      ]);

      const sortedDates = Array.from(allDates)
        .filter(date => date && date.match(/^\d{4}-\d{2}-\d{2}$/))
        .sort()
        .slice(-60); // Last 60 days

      console.log('PROCESSING:', sortedDates.length, 'dates');

      // Process each date using Goals page logic
      const wellnessData: WellnessDataPoint[] = sortedDates.map(date => {
        // Workout reps - sum all workouts for the day
        const dayLog = workoutDailyLogs[date] || {};
        const workoutReps = Object.values(dayLog).reduce((sum: number, reps: any) => {
          return sum + (typeof reps === 'number' ? reps : 0);
        }, 0);

        // Energy level - direct value
        const energyLevel = typeof energyData[date] === 'number' ? energyData[date] : 0;

        // Hydration - totalOz from logs
        let hydrationLevel = 0;
        const hydrationEntry = hydrationLogs[date];
        if (hydrationEntry && hydrationEntry.totalOz) {
          hydrationLevel = hydrationEntry.totalOz;
        }

        // Meditation minutes - from daily totals
        const meditationMinutes = meditationByDate[date] || 0;

        // Fasting hours - from daily totals
        const fastingHours = fastingByDate[date] || 0;

        const dataPoint: WellnessDataPoint = {
          date,
          workoutReps,
          energyLevel,
          hydrationLevel,
          meditationMinutes,
          fastingHours
        };

        // Log any day with activity
        if (workoutReps > 0 || energyLevel > 0 || hydrationLevel > 0 || meditationMinutes > 0 || fastingHours > 0) {
          console.log(`${date}:`, {
            workouts: workoutReps,
            energy: energyLevel,
            hydration: hydrationLevel + 'oz',
            meditation: meditationMinutes + 'min',
            fasting: fastingHours.toFixed(1) + 'h'
          });
        }

        return dataPoint;
      });

      // Verify totals match Goals page
      const totalStats = getTotalStats();
      const totalWorkouts = wellnessData.reduce((sum, d) => sum + d.workoutReps, 0);
      
      console.log('VERIFICATION AGAINST GOALS PAGE:', {
        predictionsTotal: totalWorkouts,
        goalsPageTotal: totalStats.totalReps,
        match: totalWorkouts === totalStats.totalReps ? '✅' : '❌'
      });

      const dataWithActivity = wellnessData.filter(dp => 
        dp.workoutReps > 0 || dp.energyLevel > 0 || dp.hydrationLevel > 0 || 
        dp.meditationMinutes > 0 || dp.fastingHours > 0
      );

      console.log('FINAL SUMMARY:', {
        totalDays: wellnessData.length,
        activeDays: dataWithActivity.length,
        workoutDays: dataWithActivity.filter(d => d.workoutReps > 0).length,
        energyDays: dataWithActivity.filter(d => d.energyLevel > 0).length,
        hydrationDays: dataWithActivity.filter(d => d.hydrationLevel > 0).length,
        meditationDays: dataWithActivity.filter(d => d.meditationMinutes > 0).length,
        fastingDays: dataWithActivity.filter(d => d.fastingHours > 0).length
      });

      return wellnessData;
    } catch (error) {
      console.error('ERROR aggregating wellness data:', error);
      return [];
    }
  };

  // Generate predictions
  const generatePredictions = () => {
    console.log('GENERATING PREDICTIONS WITH GOALS PAGE LOGIC...');
    setIsLoading(true);
    try {
      const wellnessData = aggregateWellnessData();
      
      if (wellnessData.length === 0) {
        console.log('NO DATA FOR PREDICTIONS');
        setPredictions(null);
        setIsLoading(false);
        return;
      }

      const newPredictions = wellnessPredictor.predictWellnessTrends(wellnessData);
      console.log('PREDICTIONS GENERATED:', newPredictions);
      setPredictions(newPredictions);
    } catch (error) {
      console.error('ERROR generating predictions:', error);
      setPredictions(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generatePredictions();
  }, []);

  const refreshPredictions = () => {
    generatePredictions();
  };

  return {
    predictions,
    isLoading,
    refreshPredictions
  };
};