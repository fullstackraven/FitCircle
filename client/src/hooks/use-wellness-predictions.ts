import { useState, useEffect } from 'react';
import { wellnessPredictor, WellnessDataPoint, WellnessPredictions } from '@/utils/mlPredictor';
import { useWorkouts } from './use-workouts';

// Hook to aggregate all wellness data and generate ML predictions
export const useWellnessPredictions = () => {
  const [predictions, setPredictions] = useState<WellnessPredictions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getDailyLogs, getWorkoutArray } = useWorkouts();

  // Aggregate all wellness data from various localStorage sources
  const aggregateWellnessData = (): WellnessDataPoint[] => {
    try {
      // Get workout data
      const dailyLogs = getDailyLogs() || {};
      const workouts = getWorkoutArray() || [];

      // Get energy levels
      const energyLevels = JSON.parse(localStorage.getItem('fitcircle_energy_levels') || '{}');

      // Get hydration data
      const hydrationData = JSON.parse(localStorage.getItem('fitcircle_hydration') || '{}');

      // Get meditation data  
      const meditationData = JSON.parse(localStorage.getItem('fitcircle_meditation') || '{}');

      // Get fasting data
      const fastingData = JSON.parse(localStorage.getItem('fitcircle_fasting') || '{}');

      console.log('Debug - Raw data:', {
        dailyLogs: Object.keys(dailyLogs).length,
        energyLevels: Object.keys(energyLevels).length,
        hydrationData: Object.keys(hydrationData).length,
        meditationData: Object.keys(meditationData).length,
        fastingData: Object.keys(fastingData).length
      });

      // Get measurements data
      const measurementsData = JSON.parse(localStorage.getItem('fitcircle_measurements') || '{}');

      // Get all unique dates from all data sources
      const allDates = new Set([
        ...Object.keys(dailyLogs),
        ...Object.keys(energyLevels),
        ...Object.keys(hydrationData),
        ...Object.keys(meditationData),
        ...Object.keys(fastingData),
        ...Object.keys(measurementsData)
      ]);

      // Sort dates and get last 60 days for prediction (more manageable dataset)
      const sortedDates = Array.from(allDates)
        .filter(date => date && date.length === 10) // Only valid YYYY-MM-DD dates
        .sort()
        .slice(-60); // Last 60 days for better predictions

      console.log('Debug - Date range:', {
        totalDates: allDates.size,
        filteredDates: sortedDates.length,
        dateRange: sortedDates.length > 0 ? `${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}` : 'none'
      });

      // Aggregate data for each date
      const wellnessData: WellnessDataPoint[] = sortedDates.map(date => {
        // Workout reps for the day
        const dayWorkouts = dailyLogs[date] || {};
        const workoutReps = Object.values(dayWorkouts).reduce((sum: number, reps: number) => sum + reps, 0);

        // Energy level (1-10) - stored directly as number
        const energyLevel = energyLevels[date] || 0;

        // Hydration level (glasses) - check different possible data structures
        let hydration = 0;
        if (hydrationData[date]) {
          if (typeof hydrationData[date] === 'number') {
            hydration = hydrationData[date];
          } else if (hydrationData[date].glasses) {
            hydration = hydrationData[date].glasses;
          } else if (hydrationData[date].total) {
            hydration = hydrationData[date].total;
          }
        }

        // Meditation minutes - check if it's sessions array or direct minutes
        let meditationMinutes = 0;
        if (meditationData[date]) {
          if (Array.isArray(meditationData[date])) {
            meditationMinutes = meditationData[date].reduce((total: number, session: any) => {
              return total + (session.duration || session.minutes || 0);
            }, 0);
          } else if (typeof meditationData[date] === 'number') {
            meditationMinutes = meditationData[date];
          }
        }

        // Fasting hours - check different data structures  
        let fastingHours = 0;
        const fastingEntry = fastingData[date];
        if (fastingEntry) {
          if (fastingEntry.startTime && fastingEntry.endTime) {
            const start = new Date(fastingEntry.startTime);
            const end = new Date(fastingEntry.endTime);
            fastingHours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
          } else if (fastingEntry.hours) {
            fastingHours = fastingEntry.hours;
          } else if (typeof fastingEntry === 'number') {
            fastingHours = fastingEntry;
          }
        }

        console.log(`Debug - ${date}:`, {
          workoutReps,
          energyLevel,
          hydration,
          meditationMinutes,
          fastingHours,
          rawData: {
            energyRaw: energyLevels[date],
            hydrationRaw: hydrationData[date],
            meditationRaw: meditationData[date],
            fastingRaw: fastingData[date]
          }
        });

        // Weight and measurements
        const measurements = measurementsData[date];
        const weight = measurements?.weight;

        return {
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
      const newPredictions = wellnessPredictor.predictWellnessTrends(wellnessData);
      setPredictions(newPredictions);
    } catch (error) {
      console.error('Error generating predictions:', error);
      setPredictions(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate predictions when data changes
  useEffect(() => {
    generatePredictions();
  }, []);

  // Manual refresh function
  const refreshPredictions = () => {
    generatePredictions();
  };

  return {
    predictions,
    isLoading,
    refreshPredictions
  };
};