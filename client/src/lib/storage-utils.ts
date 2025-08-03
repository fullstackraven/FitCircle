// Centralized localStorage utilities to eliminate duplication
export function safeParseJSON<T>(data: string | null, fallback: T): T {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return fallback;
  }
}

export function createStorageHook<T>(key: string, defaultValue: T) {
  return {
    get: (): T => safeParseJSON(localStorage.getItem(key), defaultValue),
    set: (value: T): void => localStorage.setItem(key, JSON.stringify(value)),
    remove: (): void => localStorage.removeItem(key)
  };
}

// Standardized storage keys
export const STORAGE_KEYS = {
  WORKOUTS: 'workout-tracker-data', // Keep existing key for compatibility
  HYDRATION: 'fitcircle_hydration_data',
  GOALS: 'fitcircle_goals',
  MEASUREMENTS: 'fitcircle_measurements_history',
  PROFILE: 'fitcircle_profile',
  FOOD_TRACKER_DATA: 'fitcircle_food_tracker_data',
  MEDITATION: 'fitcircle_meditation_logs',
  FASTING: 'fitcircle_fasting_logs',
  SUPPLEMENTS: 'fitcircle_supplements',
  FOOD_TRACKER: 'fitcircle_food_tracker',
  REMINDERS: 'fitcircle_reminders',
  AUTO_BACKUP_ENABLED: 'fitcircle_auto_backup_enabled',
  LAST_AUTO_BACKUP: 'fitcircle_last_auto_backup',
  DEVICE_ID: 'fitcircle_device_id',
  CARDIO: 'fitcircle_cardio_data',
  RECOVERY: 'fitcircle_recovery_data',
  WORKOUT_LOGS: 'workout-tracker-logs'
} as const;