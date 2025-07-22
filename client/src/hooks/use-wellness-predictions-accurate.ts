import { useState, useEffect } from 'react';
import { wellnessPredictor, WellnessDataPoint, WellnessPredictions } from '@/utils/mlPredictor';
import { useWorkouts } from '@/hooks/use-workouts';

// Use the exact same data sources as the Statistics section
export const useWellnessPredictionsAccurate = () => {
  const [predictions, setPredictions] = useState<WellnessPredictions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use the same hooks as Statistics section
  const { getDailyLogs, getTotalStats, getIndividualWorkoutTotals } = useWorkouts();

  // Get meditation data exactly like the app does
  const getMeditationData = () => {
    try {
      const meditationRaw = localStorage.getItem('fitcircle_meditation') || '[]';
      return JSON.parse(meditationRaw);
    } catch {
      return [];
    }
  };

  // Get fasting data exactly like the app does
  const getFastingData = () => {
    try {
      const fastingRaw = localStorage.getItem('fitcircle_fasting') || '[]';
      return JSON.parse(fastingRaw);
    } catch {
      return [];
    }
  };

  // Get hydration data exactly like the app does
  const getHydrationData = () => {
    try {
      const hydrationRaw = localStorage.getItem('fitcircle_hydration_data') || '{}';
      const parsed = JSON.parse(hydrationRaw);
      return parsed.logs || {};
    } catch {
      return {};
    }
  };

  // Get energy data exactly like the app does
  const getEnergyData = () => {
    try {
      const energyRaw = localStorage.getItem('fitcircle_energy_levels') || '{}';
      return JSON.parse(energyRaw);
    } catch {
      return {};
    }
  };

  // Aggregate wellness data using the SAME functions as Statistics section
  const aggregateWellnessData = (): WellnessDataPoint[] => {
    try {
      console.log('=== USING SAME DATA AS STATISTICS SECTION ===');
      
      // 1. WORKOUT DATA - Use exact same source as Statistics section
      const dailyLogs = getDailyLogs() || {};
      const totalStats = getTotalStats();
      const individualTotals = getIndividualWorkoutTotals();
      
      console.log('WORKOUT STATS FROM STATISTICS:', {
        totalReps: totalStats?.totalReps || 0,
        individualTotals: individualTotals?.map(w => ({ name: w.name, total: w.totalReps })) || []
      });

      // 2. OTHER DATA SOURCES - Use same localStorage keys as app
      const meditationSessions = getMeditationData();
      const fastingSessions = getFastingData();
      const hydrationLogs = getHydrationData();
      const energyData = getEnergyData();

      console.log('OTHER DATA SOURCES:', {
        meditation: meditationSessions.length + ' sessions',
        fasting: fastingSessions.length + ' sessions', 
        hydration: Object.keys(hydrationLogs).length + ' days',
        energy: Object.keys(energyData).length + ' days'
      });

      // Get all unique dates from all sources
      const allDates = new Set([
        ...Object.keys(dailyLogs),
        ...Object.keys(hydrationLogs),
        ...Object.keys(energyData),
        ...meditationSessions.map((s: any) => {
          if (s.date) {
            const date = new Date(s.date);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          }
          return null;
        }).filter(Boolean),
        ...fastingSessions.map((s: any) => s.startDate || s.endDate).filter(Boolean)
      ]);

      const sortedDates = Array.from(allDates)
        .filter(date => date && date.match(/^\d{4}-\d{2}-\d{2}$/))
        .sort()
        .slice(-60); // Last 60 days

      console.log('PROCESSING DATES:', {
        totalDates: sortedDates.length,
        dateRange: `${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`
      });

      // Group meditation by date (like the app does)
      const meditationByDate: { [date: string]: any[] } = {};
      meditationSessions.forEach((session: any) => {
        if (session.date) {
          const date = new Date(session.date);
          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          if (!meditationByDate[dateStr]) meditationByDate[dateStr] = [];
          meditationByDate[dateStr].push(session);
        }
      });

      // Group fasting by date (like the app does)
      const fastingByDate: { [date: string]: any[] } = {};
      fastingSessions.forEach((session: any) => {
        const date = session.startDate || session.endDate;
        if (date) {
          if (!fastingByDate[date]) fastingByDate[date] = [];
          fastingByDate[date].push(session);
        }
      });

      // Process each date
      const wellnessData: WellnessDataPoint[] = sortedDates.map(date => {
        // WORKOUT REPS - Use exact same calculation as Statistics
        const dayLog = dailyLogs[date] || {};
        const workoutReps = Object.values(dayLog).reduce((sum: number, reps: any) => {
          return sum + (typeof reps === 'number' ? reps : 0);
        }, 0);

        // ENERGY LEVEL - Direct from localStorage (same as app)
        const energyLevel = typeof energyData[date] === 'number' ? energyData[date] : 0;

        // HYDRATION - Use totalOz from logs (same as app)
        let hydrationLevel = 0;
        const hydrationEntry = hydrationLogs[date];
        if (hydrationEntry && hydrationEntry.totalOz) {
          hydrationLevel = hydrationEntry.totalOz;
        }

        // MEDITATION - Sum duration for the day (same as app)
        let meditationMinutes = 0;
        const daySessions = meditationByDate[date] || [];
        meditationMinutes = daySessions.reduce((total: number, session: any) => {
          return total + (session.duration || 0);
        }, 0);

        // FASTING - Convert duration minutes to hours (same as app)
        let fastingHours = 0;
        const dayFasting = fastingByDate[date] || [];
        if (dayFasting.length > 0) {
          const session = dayFasting[0];
          if (session.duration) {
            fastingHours = session.duration / 60; // Convert minutes to hours
          }
        }

        const dataPoint: WellnessDataPoint = {
          date,
          workoutReps,
          energyLevel,
          hydrationLevel,
          meditationMinutes,
          fastingHours
        };

        // Log data for this date if it has activity
        if (workoutReps > 0 || energyLevel > 0 || hydrationLevel > 0 || meditationMinutes > 0 || fastingHours > 0) {
          console.log(`${date}:`, {
            workouts: workoutReps + ' reps',
            energy: energyLevel + '/10',
            hydration: hydrationLevel + ' oz',
            meditation: meditationMinutes + ' min',
            fasting: fastingHours.toFixed(1) + ' hrs'
          });
        }

        return dataPoint;
      });

      // Filter to days with activity
      const dataWithActivity = wellnessData.filter(dp => 
        dp.workoutReps > 0 || dp.energyLevel > 0 || dp.hydrationLevel > 0 || 
        dp.meditationMinutes > 0 || dp.fastingHours > 0
      );

      console.log('FINAL DATA SUMMARY (MATCHING STATISTICS):', {
        totalDays: wellnessData.length,
        activeDays: dataWithActivity.length,
        totalWorkoutReps: dataWithActivity.reduce((sum, d) => sum + d.workoutReps, 0),
        totalMeditationMinutes: dataWithActivity.reduce((sum, d) => sum + d.meditationMinutes, 0),
        totalHydrationOz: dataWithActivity.reduce((sum, d) => sum + d.hydrationLevel, 0),
        averageFastingHours: dataWithActivity.filter(d => d.fastingHours > 0).reduce((sum, d) => sum + d.fastingHours, 0) / Math.max(1, dataWithActivity.filter(d => d.fastingHours > 0).length),
        verifyTotalStats: totalStats
      });

      return wellnessData;
    } catch (error) {
      console.error('ERROR aggregating wellness data:', error);
      return [];
    }
  };

  // Generate predictions
  const generatePredictions = () => {
    console.log('GENERATING PREDICTIONS WITH STATISTICS DATA...');
    setIsLoading(true);
    try {
      const wellnessData = aggregateWellnessData();
      
      if (wellnessData.length === 0) {
        console.log('NO ACTIVITY DATA FOR PREDICTIONS');
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