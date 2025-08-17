/**
 * Centralized storage keys for FitCircle app
 * All localStorage keys are defined here to prevent conflicts and ensure consistency
 */

export const STORAGE_KEYS = {
  // Core app data
  workouts: 'fitcircle:workouts',
  hydration: 'fitcircle:hydration', 
  fasting: 'fitcircle:fasting',
  goals: 'fitcircle:goals',
  reminders: 'fitcircle:reminders',
  cardio: 'fitcircle:cardio',
  recovery: 'fitcircle:recovery',
  measurements: 'fitcircle:measurements',
  meditation: 'fitcircle:meditation',
  supplements: 'fitcircle:supplements',
  energyLevel: 'fitcircle:energyLevel',
  
  // App metadata
  version: 'fitcircle:version',
  lastMigration: 'fitcircle:lastMigration',
  
  // Legacy keys to migrate from
  legacy: {
    workoutLogs: 'WORKOUT_LOGS',
    workoutTracker: 'workout-tracker-logs',
    goalPrefix: 'fitcircle_goal_',
    hydrationLogs: 'HYDRATION_LOGS',
    fastingLogs: 'FASTING_LOGS',
    cardioLogs: 'CARDIO_LOGS',
    recoveryLogs: 'RECOVERY_LOGS',
    remindersData: 'REMINDERS_DATA',
    measurementsData: 'MEASUREMENTS_DATA',
    meditationData: 'MEDITATION_DATA',
    supplementsData: 'SUPPLEMENTS_DATA',
    energyLevelData: 'ENERGY_LEVEL_DATA'
  }
} as const;

export const K = STORAGE_KEYS;

// Type for storage key validation
export type StorageKey = keyof typeof STORAGE_KEYS;
export type LegacyStorageKey = keyof typeof STORAGE_KEYS.legacy;