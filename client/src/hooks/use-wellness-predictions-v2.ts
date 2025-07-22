import { useState, useEffect } from 'react';
import { wellnessPredictor, WellnessDataPoint, WellnessPredictions } from '@/utils/mlPredictor';

// New version using complete localStorage JSON data like backup/export system
export const useWellnessPredictionsV2 = () => {
  const [predictions, setPredictions] = useState<WellnessPredictions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get all localStorage data like the backup system does
  const getAllLocalStorageData = () => {
    const data: { [key: string]: any } = {};
    
    // Get all fitcircle keys from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('fitcircle_')) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            data[key] = JSON.parse(value);
          }
        } catch (error) {
          console.warn(`Error parsing localStorage key ${key}:`, error);
        }
      }
    }
    
    return data;
  };

  // Aggregate wellness data using the complete localStorage dump
  const aggregateWellnessData = (): WellnessDataPoint[] => {
    try {
      const allData = getAllLocalStorageData();
      
      console.log('Debug - All localStorage keys found:', Object.keys(allData));
      
      // Extract different data sources - check actual localStorage structure
      const workoutData = allData['workout-tracker-data'] || {};
      const dailyLogs = workoutData.dailyLogs || {};
      
      const energyLevels = allData['fitcircle_energy_levels'] || {};
      const hydrationData = allData['fitcircle_hydration'] || {};
      const meditationData = allData['fitcircle_meditation'] || {};
      const fastingData = allData['fitcircle_fasting'] || {};
      const measurementsData = allData['fitcircle_measurements'] || {};

      console.log('Debug - Raw localStorage data structure:', {
        allKeys: Object.keys(allData),
        workoutDataKeys: Object.keys(workoutData),
        dailyLogsKeys: Object.keys(dailyLogs),
        energyKeys: Object.keys(energyLevels),
        hydrationKeys: Object.keys(hydrationData),
        sampleDailyLog: Object.keys(dailyLogs).length > 0 ? dailyLogs[Object.keys(dailyLogs)[0]] : null
      });

      console.log('Debug - Data sources found:', {
        workouts: Object.keys(dailyLogs).length + ' days',
        energy: Object.keys(energyLevels).length + ' days',
        hydration: Object.keys(hydrationData).length + ' days',
        meditation: Object.keys(meditationData).length + ' days', 
        fasting: Object.keys(fastingData).length + ' days',
        measurements: Object.keys(measurementsData).length + ' days'
      });

      // Get all unique dates
      const allDates = new Set([
        ...Object.keys(dailyLogs),
        ...Object.keys(energyLevels),
        ...Object.keys(hydrationData),
        ...Object.keys(meditationData),
        ...Object.keys(fastingData),
        ...Object.keys(measurementsData)
      ]);

      // Filter and sort dates (last 60 days)
      const sortedDates = Array.from(allDates)
        .filter(date => date && date.match(/^\d{4}-\d{2}-\d{2}$/)) // Valid YYYY-MM-DD format
        .sort()
        .slice(-60);

      console.log('Debug - Processing date range:', {
        totalUniqueDates: allDates.size,
        validDates: sortedDates.length,
        dateRange: sortedDates.length > 0 ? `${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}` : 'none'
      });

      // Process each date
      const wellnessData: WellnessDataPoint[] = sortedDates.map(date => {
        // Workout reps for the day
        const dayWorkouts = dailyLogs[date] || {};
        const workoutReps = Object.values(dayWorkouts).reduce((sum: number, reps: any) => {
          return sum + (typeof reps === 'number' ? reps : 0);
        }, 0);

        // Energy level (1-10)
        const energyLevel = typeof energyLevels[date] === 'number' ? energyLevels[date] : 0;

        // Hydration level - handle different structures
        let hydration = 0;
        const hydrationEntry = hydrationData[date];
        if (hydrationEntry) {
          if (typeof hydrationEntry === 'number') {
            hydration = hydrationEntry;
          } else if (hydrationEntry.glasses) {
            hydration = hydrationEntry.glasses;
          } else if (hydrationEntry.total) {
            hydration = hydrationEntry.total;
          } else if (hydrationEntry.logs && Array.isArray(hydrationEntry.logs)) {
            hydration = hydrationEntry.logs.length;
          }
        }

        // Meditation minutes - handle sessions array
        let meditationMinutes = 0;
        const meditationEntry = meditationData[date];
        if (meditationEntry && Array.isArray(meditationEntry)) {
          meditationMinutes = meditationEntry.reduce((total: number, session: any) => {
            return total + (session.duration || session.minutes || 0);
          }, 0);
        }

        // Fasting hours - handle time ranges
        let fastingHours = 0;
        const fastingEntry = fastingData[date];
        if (fastingEntry) {
          if (fastingEntry.startTime && fastingEntry.endTime) {
            const start = new Date(fastingEntry.startTime);
            const end = new Date(fastingEntry.endTime);
            const diffMs = end.getTime() - start.getTime();
            fastingHours = Math.max(0, diffMs / (1000 * 60 * 60));
          } else if (typeof fastingEntry.hours === 'number') {
            fastingHours = fastingEntry.hours;
          }
        }

        // Weight from measurements
        const measurements = measurementsData[date];
        const weight = measurements?.weight;

        const dataPoint = {
          date,
          workoutReps,
          energyLevel,
          hydrationLevel: hydration,
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

        // Log non-zero data points for debugging
        const hasData = workoutReps > 0 || energyLevel > 0 || hydration > 0 || meditationMinutes > 0 || fastingHours > 0;
        if (hasData) {
          console.log(`Debug - ${date} (has data):`, dataPoint);
        }

        return dataPoint;
      });

      const dataPointsWithData = wellnessData.filter(dp => 
        dp.workoutReps > 0 || dp.energyLevel > 0 || dp.hydrationLevel > 0 || dp.meditationMinutes > 0 || dp.fastingHours > 0
      );

      console.log('Debug - Final data summary:', {
        totalDays: wellnessData.length,
        daysWithData: dataPointsWithData.length,
        avgWorkouts: dataPointsWithData.length > 0 ? 
          (dataPointsWithData.reduce((sum, dp) => sum + dp.workoutReps, 0) / dataPointsWithData.length).toFixed(1) : '0',
        avgEnergy: dataPointsWithData.length > 0 ? 
          (dataPointsWithData.reduce((sum, dp) => sum + dp.energyLevel, 0) / dataPointsWithData.length).toFixed(1) : '0'
      });

      return wellnessData;
    } catch (error) {
      console.error('Error aggregating wellness data:', error);
      return [];
    }
  };

  // Generate predictions
  const generatePredictions = () => {
    setIsLoading(true);
    try {
      const wellnessData = aggregateWellnessData();
      console.log('Debug - Generating predictions with data points:', wellnessData.length);
      const newPredictions = wellnessPredictor.predictWellnessTrends(wellnessData);
      console.log('Debug - Generated predictions:', newPredictions);
      setPredictions(newPredictions);
    } catch (error) {
      console.error('Error generating predictions:', error);
      setPredictions(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate predictions on mount
  useEffect(() => {
    console.log('Debug - useEffect triggered, generating initial predictions');
    generatePredictions();
  }, []);

  // Manual refresh function
  const refreshPredictions = () => {
    console.log('Debug - Refresh button clicked, regenerating predictions');
    generatePredictions();
  };

  return {
    predictions,
    isLoading,
    refreshPredictions
  };
};