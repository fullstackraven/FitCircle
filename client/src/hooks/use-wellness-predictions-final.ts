import { useState, useEffect } from 'react';
import { wellnessPredictor, WellnessDataPoint, WellnessPredictions } from '@/utils/mlPredictor';

// Final comprehensive version - audit the entire localStorage structure
export const useWellnessPredictionsFinal = () => {
  const [predictions, setPredictions] = useState<WellnessPredictions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Debug localStorage structure completely
  const debugLocalStorage = () => {
    console.log('=== COMPLETE LOCALSTORAGE AUDIT ===');
    
    const allKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) allKeys.push(key);
    }
    
    console.log('ALL localStorage keys:', allKeys);
    
    // Check each key structure
    allKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const parsed = JSON.parse(value);
          console.log(`KEY: ${key}`, typeof parsed === 'object' ? Object.keys(parsed) : typeof parsed);
          if (key.includes('workout')) {
            console.log(`${key} SAMPLE:`, parsed);
          }
        }
      } catch (e) {
        console.log(`${key}: Not JSON parseable`);
      }
    });
  };

  // Aggregate wellness data using actual localStorage structure
  const aggregateWellnessData = (): WellnessDataPoint[] => {
    try {
      debugLocalStorage();
      
      // Get workout data - check both possible keys
      let workoutDailyLogs: { [date: string]: { [workoutId: string]: number } } = {};
      const workoutTrackerData = localStorage.getItem('workout-tracker-data');
      const fitcircleWorkouts = localStorage.getItem('fitcircle_workouts');
      
      if (workoutTrackerData) {
        const parsed = JSON.parse(workoutTrackerData);
        workoutDailyLogs = parsed.dailyLogs || {};
        console.log('WORKOUT DATA from workout-tracker-data:', Object.keys(workoutDailyLogs).length, 'days');
        console.log('SAMPLE WORKOUT DAY:', Object.keys(workoutDailyLogs)[0], workoutDailyLogs[Object.keys(workoutDailyLogs)[0]]);
      }
      
      if (fitcircleWorkouts) {
        const parsed = JSON.parse(fitcircleWorkouts);
        console.log('ALTERNATIVE WORKOUT DATA from fitcircle_workouts:', parsed);
        // Use this if it has more data
        if (parsed.dailyLogs && Object.keys(parsed.dailyLogs).length > Object.keys(workoutDailyLogs).length) {
          workoutDailyLogs = parsed.dailyLogs;
        }
      }

      // Get other data
      const energyData = JSON.parse(localStorage.getItem('fitcircle_energy_levels') || '{}');
      const hydrationData = JSON.parse(localStorage.getItem('fitcircle_hydration') || '{}');
      const meditationData = JSON.parse(localStorage.getItem('fitcircle_meditation') || '{}');
      const fastingData = JSON.parse(localStorage.getItem('fitcircle_fasting') || '{}');
      const measurementsData = JSON.parse(localStorage.getItem('fitcircle_measurements') || '{}');

      console.log('DATA SOURCES FOUND:', {
        workoutDays: Object.keys(workoutDailyLogs).length,
        energyDays: Object.keys(energyData).length,
        hydrationDays: Object.keys(hydrationData).length,
        meditationDays: Object.keys(meditationData).length,
        fastingDays: Object.keys(fastingData).length,
        measurementDays: Object.keys(measurementsData).length
      });

      // Get all unique dates
      const allDates = new Set([
        ...Object.keys(workoutDailyLogs),
        ...Object.keys(energyData),
        ...Object.keys(hydrationData),
        ...Object.keys(meditationData),
        ...Object.keys(fastingData),
        ...Object.keys(measurementsData)
      ]);

      console.log('UNIQUE DATES FOUND:', allDates.size, 'total dates');
      console.log('DATE SAMPLES:', Array.from(allDates).slice(0, 5));

      // Sort dates and get recent data
      const sortedDates = Array.from(allDates)
        .filter(date => date && date.match(/^\d{4}-\d{2}-\d{2}$/))
        .sort()
        .slice(-60); // Last 60 days

      console.log('PROCESSING DATE RANGE:', {
        validDates: sortedDates.length,
        firstDate: sortedDates[0],
        lastDate: sortedDates[sortedDates.length - 1]
      });

      // Process each date
      const wellnessData: WellnessDataPoint[] = sortedDates.map(date => {
        // Workout reps - sum all workouts for the day
        const dayWorkouts = workoutDailyLogs[date] || {};
        const workoutReps = Object.values(dayWorkouts).reduce((sum: number, reps: any) => {
          return sum + (typeof reps === 'number' ? reps : 0);
        }, 0);

        // Energy level - direct number
        const energyLevel = typeof energyData[date] === 'number' ? energyData[date] : 0;

        // Hydration - check different possible structures
        let hydrationLevel = 0;
        const hydrationEntry = hydrationData[date];
        if (hydrationEntry) {
          if (typeof hydrationEntry === 'number') {
            hydrationLevel = hydrationEntry;
          } else if (hydrationEntry.glasses) {
            hydrationLevel = hydrationEntry.glasses;
          } else if (hydrationEntry.total) {
            hydrationLevel = hydrationEntry.total;
          } else if (hydrationEntry.logs && Array.isArray(hydrationEntry.logs)) {
            hydrationLevel = hydrationEntry.logs.length;
          }
        }

        // Meditation minutes - sum all sessions
        let meditationMinutes = 0;
        const meditationEntry = meditationData[date];
        if (Array.isArray(meditationEntry)) {
          meditationMinutes = meditationEntry.reduce((total: number, session: any) => {
            return total + (session.duration || session.minutes || 0);
          }, 0);
        } else if (typeof meditationEntry === 'number') {
          meditationMinutes = meditationEntry;
        }

        // Fasting hours - calculate from time range or direct hours
        let fastingHours = 0;
        const fastingEntry = fastingData[date];
        if (fastingEntry) {
          if (fastingEntry.startTime && fastingEntry.endTime) {
            const start = new Date(fastingEntry.startTime);
            const end = new Date(fastingEntry.endTime);
            const diffMs = end.getTime() - start.getTime();
            if (diffMs > 0) {
              fastingHours = diffMs / (1000 * 60 * 60);
            }
          } else if (typeof fastingEntry.hours === 'number') {
            fastingHours = fastingEntry.hours;
          } else if (typeof fastingEntry === 'number') {
            fastingHours = fastingEntry;
          }
        }

        // Weight and measurements
        const measurements = measurementsData[date];
        const weight = measurements?.weight;

        const dataPoint: WellnessDataPoint = {
          date,
          workoutReps,
          energyLevel,
          hydrationLevel,
          meditationMinutes,
          fastingHours,
          weight,
          measurements: measurements ? {
            chest: measurements.chest,
            waist: measurements.waist,
            biceps: measurements.biceps,
            thighs: measurements.thighs
          } : undefined
        };

        // Log any day with actual data
        if (workoutReps > 0 || energyLevel > 0 || hydrationLevel > 0 || meditationMinutes > 0 || fastingHours > 0) {
          console.log(`DATA FOUND - ${date}:`, {
            workoutReps,
            energyLevel,
            hydrationLevel,
            meditationMinutes,
            fastingHours
          });
        }

        return dataPoint;
      });

      const dataWithActivity = wellnessData.filter(dp => 
        dp.workoutReps > 0 || dp.energyLevel > 0 || dp.hydrationLevel > 0 || 
        dp.meditationMinutes > 0 || dp.fastingHours > 0
      );

      console.log('FINAL WELLNESS DATA SUMMARY:', {
        totalDays: wellnessData.length,
        daysWithActivity: dataWithActivity.length,
        hasWorkouts: dataWithActivity.filter(d => d.workoutReps > 0).length,
        hasEnergy: dataWithActivity.filter(d => d.energyLevel > 0).length,
        hasHydration: dataWithActivity.filter(d => d.hydrationLevel > 0).length,
        hasMeditation: dataWithActivity.filter(d => d.meditationMinutes > 0).length,
        hasFasting: dataWithActivity.filter(d => d.fastingHours > 0).length
      });

      return wellnessData;
    } catch (error) {
      console.error('ERROR in aggregateWellnessData:', error);
      return [];
    }
  };

  // Generate predictions
  const generatePredictions = () => {
    console.log('STARTING PREDICTION GENERATION...');
    setIsLoading(true);
    try {
      const wellnessData = aggregateWellnessData();
      
      if (wellnessData.length === 0) {
        console.log('NO DATA AVAILABLE FOR PREDICTIONS');
        setPredictions(null);
        setIsLoading(false);
        return;
      }

      console.log('GENERATING PREDICTIONS with', wellnessData.length, 'data points');
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

  // Generate predictions on mount
  useEffect(() => {
    console.log('WELLNESS PREDICTIONS HOOK INITIALIZED');
    generatePredictions();
  }, []);

  // Manual refresh function
  const refreshPredictions = () => {
    console.log('REFRESH PREDICTIONS REQUESTED');
    generatePredictions();
  };

  return {
    predictions,
    isLoading,
    refreshPredictions
  };
};