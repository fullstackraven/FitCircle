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

      // Sort dates and get last 90 days for prediction
      const sortedDates = Array.from(allDates)
        .sort()
        .slice(-90); // Last 90 days for better predictions

      // Aggregate data for each date
      const wellnessData: WellnessDataPoint[] = sortedDates.map(date => {
        // Workout reps for the day
        const dayWorkouts = dailyLogs[date] || {};
        const workoutReps = Object.values(dayWorkouts).reduce((sum: number, reps: number) => sum + reps, 0);

        // Energy level (1-10)
        const energyLevel = energyLevels[date] || 0;

        // Hydration level (glasses)
        const hydration = hydrationData[date]?.glasses || 0;

        // Meditation minutes
        const meditationSessions = meditationData[date] || [];
        const meditationMinutes = Array.isArray(meditationSessions) 
          ? meditationSessions.reduce((total: number, session: any) => total + (session.duration || 0), 0)
          : 0;

        // Fasting hours
        const fastingEntry = fastingData[date];
        let fastingHours = 0;
        if (fastingEntry && fastingEntry.startTime && fastingEntry.endTime) {
          const start = new Date(fastingEntry.startTime);
          const end = new Date(fastingEntry.endTime);
          fastingHours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
        }

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