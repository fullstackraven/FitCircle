import { useState, useEffect } from 'react';
import { wellnessPredictor, WellnessDataPoint, WellnessPredictions } from '@/utils/mlPredictor';

// Correct version based on actual JSON backup structure
export const useWellnessPredictionsCorrect = () => {
  const [predictions, setPredictions] = useState<WellnessPredictions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Aggregate wellness data using the ACTUAL data structure from JSON backup
  const aggregateWellnessData = (): WellnessDataPoint[] => {
    try {
      console.log('=== PARSING ACTUAL DATA STRUCTURE ===');
      
      // 1. WORKOUT DATA - from "workout-tracker-data" key
      let workoutDailyLogs: { [date: string]: { [workoutId: string]: number } } = {};
      const workoutTrackerRaw = localStorage.getItem('workout-tracker-data');
      if (workoutTrackerRaw) {
        const workoutData = JSON.parse(workoutTrackerRaw);
        workoutDailyLogs = workoutData.dailyLogs || {};
        console.log('WORKOUT DATA FOUND:', Object.keys(workoutDailyLogs).length, 'days');
      }

      // 2. ENERGY LEVELS - from "fitcircle_energy_levels" (simple date:value object)
      const energyRaw = localStorage.getItem('fitcircle_energy_levels') || '{}';
      const energyData = JSON.parse(energyRaw);
      console.log('ENERGY DATA:', energyData);

      // 3. HYDRATION - from "fitcircle_hydration_data" (complex nested structure)
      const hydrationRaw = localStorage.getItem('fitcircle_hydration_data') || '{}';
      const hydrationData = JSON.parse(hydrationRaw);
      const hydrationLogs = hydrationData.logs || {};
      console.log('HYDRATION LOGS:', Object.keys(hydrationLogs).length, 'days');

      // 4. MEDITATION - from "fitcircle_meditation" (array of session objects)
      const meditationRaw = localStorage.getItem('fitcircle_meditation') || '[]';
      const meditationSessions = JSON.parse(meditationRaw);
      console.log('MEDITATION SESSIONS:', meditationSessions.length, 'total sessions');
      
      // Group meditation by date
      const meditationByDate: { [date: string]: any[] } = {};
      meditationSessions.forEach((session: any) => {
        const date = session.date ? new Date(session.date).toISOString().split('T')[0] : null;
        if (date) {
          if (!meditationByDate[date]) meditationByDate[date] = [];
          meditationByDate[date].push(session);
        }
      });

      // 5. FASTING - from "fitcircle_fasting" (array of fasting periods)
      const fastingRaw = localStorage.getItem('fitcircle_fasting') || '[]';
      const fastingSessions = JSON.parse(fastingRaw);
      console.log('FASTING SESSIONS:', fastingSessions.length, 'total sessions');
      
      // Group fasting by date
      const fastingByDate: { [date: string]: any[] } = {};
      fastingSessions.forEach((session: any) => {
        const date = session.startDate || session.endDate;
        if (date) {
          if (!fastingByDate[date]) fastingByDate[date] = [];
          fastingByDate[date].push(session);
        }
      });

      // 6. Get all unique dates
      const allDates = new Set([
        ...Object.keys(workoutDailyLogs),
        ...Object.keys(energyData),
        ...Object.keys(hydrationLogs),
        ...Object.keys(meditationByDate),
        ...Object.keys(fastingByDate)
      ]);

      console.log('UNIQUE DATES FOUND:', allDates.size);
      console.log('DATE SAMPLES:', Array.from(allDates).slice(0, 5));

      // Sort dates and get recent data (last 60 days)
      const sortedDates = Array.from(allDates)
        .filter(date => date && date.match(/^\d{4}-\d{2}-\d{2}$/))
        .sort()
        .slice(-60);

      console.log('PROCESSING:', sortedDates.length, 'dates from', sortedDates[0], 'to', sortedDates[sortedDates.length - 1]);

      // Process each date
      const wellnessData: WellnessDataPoint[] = sortedDates.map(date => {
        // WORKOUT REPS - sum all workouts for the day
        const dayWorkouts = workoutDailyLogs[date] || {};
        const workoutReps = Object.values(dayWorkouts).reduce((sum: number, reps: any) => {
          return sum + (typeof reps === 'number' ? reps : 0);
        }, 0);

        // ENERGY LEVEL - direct number from energyData
        const energyLevel = typeof energyData[date] === 'number' ? energyData[date] : 0;

        // HYDRATION - from hydration logs totalOz
        let hydrationLevel = 0;
        const hydrationEntry = hydrationLogs[date];
        if (hydrationEntry && hydrationEntry.totalOz) {
          hydrationLevel = hydrationEntry.totalOz;
        }

        // MEDITATION MINUTES - sum all sessions for the date
        let meditationMinutes = 0;
        const daySessions = meditationByDate[date] || [];
        meditationMinutes = daySessions.reduce((total: number, session: any) => {
          return total + (session.duration || 0);
        }, 0);

        // FASTING HOURS - from duration field in minutes, convert to hours
        let fastingHours = 0;
        const dayFasting = fastingByDate[date] || [];
        if (dayFasting.length > 0) {
          const session = dayFasting[0]; // Take first session for the day
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

        // Log actual data found
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
        fastingDays: dataWithActivity.filter(d => d.fastingHours > 0).length,
        totalWorkouts: dataWithActivity.reduce((sum, d) => sum + d.workoutReps, 0),
        avgEnergy: dataWithActivity.filter(d => d.energyLevel > 0).reduce((sum, d) => sum + d.energyLevel, 0) / Math.max(1, dataWithActivity.filter(d => d.energyLevel > 0).length),
        totalHydrationOz: dataWithActivity.reduce((sum, d) => sum + d.hydrationLevel, 0),
        totalMeditationMin: dataWithActivity.reduce((sum, d) => sum + d.meditationMinutes, 0),
        avgFastingHours: dataWithActivity.filter(d => d.fastingHours > 0).reduce((sum, d) => sum + d.fastingHours, 0) / Math.max(1, dataWithActivity.filter(d => d.fastingHours > 0).length)
      });

      return wellnessData;
    } catch (error) {
      console.error('ERROR aggregating wellness data:', error);
      return [];
    }
  };

  // Generate predictions
  const generatePredictions = () => {
    console.log('GENERATING PREDICTIONS...');
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