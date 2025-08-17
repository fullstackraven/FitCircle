/**
 * Migration utilities for FitCircle app
 * Handles migration from legacy storage keys to new schema-validated storage
 */

import { K } from './keys';
import { getStorageVersion, setStorageVersion, CURRENT_VERSION } from './safeStorage';

/**
 * Migrate legacy storage keys to new format
 */
export function migrateLegacyData(): void {
  const currentVersion = getStorageVersion();
  
  if (currentVersion >= CURRENT_VERSION) {
    return; // Already migrated
  }

  try {
    // Migrate workout logs
    migrateWorkouts();
    
    // Migrate hydration data
    migrateHydration();
    
    // Migrate goals
    migrateGoals();
    
    // Migrate other data types
    migrateFasting();
    migrateCardio();
    migrateRecovery();
    migrateReminders();
    migrateMeasurements();
    migrateMeditation();
    migrateSupplements();
    migrateEnergyLevel();
    
    // Set new version
    setStorageVersion(CURRENT_VERSION);
    
    // Clean up legacy keys
    cleanupLegacyKeys();
    
    if (import.meta.env.DEV) {
      console.log('Migration completed successfully');
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Migration failed:', error);
    }
  }
}

function migrateWorkouts(): void {
  const legacyData = localStorage.getItem(K.legacy.workoutLogs) || 
                   localStorage.getItem(K.legacy.workoutTracker) ||
                   localStorage.getItem(K.legacy.workouts); // PWA format
  
  if (legacyData && !localStorage.getItem(K.workouts)) {
    try {
      const parsed = JSON.parse(legacyData);
      console.log('Migrating workout data:', parsed);
      
      // If it's already in the correct format, use as-is
      if (parsed.workouts && parsed.dailyLogs) {
        localStorage.setItem(K.workouts, legacyData);
      } else {
        // Transform legacy format to new schema
        const migrated = {
          workouts: Array.isArray(parsed) ? parsed : (parsed.workouts || {}),
          dailyLogs: parsed.dailyLogs || {},
          journalEntries: parsed.journalEntries || {},
          lastDate: parsed.lastDate || new Date().toISOString().split('T')[0]
        };
        localStorage.setItem(K.workouts, JSON.stringify(migrated));
      }
      console.log('✅ Workouts migrated successfully');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Failed to migrate workouts:', error);
      }
    }
  }
}

function migrateHydration(): void {
  const legacyData = localStorage.getItem(K.legacy.hydrationLogs) ||
                    localStorage.getItem(K.legacy.hydration); // PWA format
  
  if (legacyData && !localStorage.getItem(K.hydration)) {
    try {
      const parsed = JSON.parse(legacyData);
      console.log('Migrating hydration data:', parsed);
      // Keep existing complex hydration structure
      localStorage.setItem(K.hydration, legacyData);
      console.log('✅ Hydration migrated successfully');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Failed to migrate hydration:', error);
      }
    }
  }
}

function migrateGoals(): void {
  if (!localStorage.getItem(K.goals)) {
    const goals = {
      hydration: {
        enabled: true,
        target: parseInt(localStorage.getItem('fitcircle_goal_hydration') || '8', 10),
        unit: 'glasses'
      },
      meditation: {
        enabled: true,
        target: parseInt(localStorage.getItem('fitcircle_goal_meditation') || '10', 10),
        unit: 'minutes'
      },
      fasting: {
        enabled: true,
        target: parseInt(localStorage.getItem('fitcircle_goal_fasting') || '16', 10),
        unit: 'hours'
      },
      weight: {
        enabled: !!localStorage.getItem('fitcircle_goal_weight'),
        target: parseFloat(localStorage.getItem('fitcircle_goal_weight') || '0') || undefined,
        unit: 'lbs'
      },
      bodyFat: {
        enabled: !!localStorage.getItem('fitcircle_goal_bodyFat'),
        target: parseFloat(localStorage.getItem('fitcircle_goal_bodyFat') || '0') || undefined,
        unit: '%'
      },
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(K.goals, JSON.stringify(goals));
  }
}

function migrateFasting(): void {
  const legacyData = localStorage.getItem(K.legacy.fastingLogs) ||
                    localStorage.getItem(K.legacy.fasting); // PWA format
  
  if (legacyData && !localStorage.getItem(K.fasting)) {
    try {
      const parsed = JSON.parse(legacyData);
      console.log('Migrating fasting data:', parsed);
      
      // If it's already an array (PWA format), keep as-is
      if (Array.isArray(parsed)) {
        localStorage.setItem(K.fasting, legacyData);
      } else {
        const migrated = {
          logs: parsed || {},
          defaultType: '16:8',
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(K.fasting, JSON.stringify(migrated));
      }
      console.log('✅ Fasting migrated successfully');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Failed to migrate fasting:', error);
      }
    }
  }
}

function migrateCardio(): void {
  const legacyData = localStorage.getItem(K.legacy.cardioLogs);
  
  if (legacyData && !localStorage.getItem(K.cardio)) {
    try {
      const parsed = JSON.parse(legacyData);
      const migrated = {
        logs: parsed || {},
        customTypes: [],
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(K.cardio, JSON.stringify(migrated));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Failed to migrate cardio:', error);
      }
    }
  }
}

function migrateRecovery(): void {
  const legacyData = localStorage.getItem(K.legacy.recoveryLogs);
  
  if (legacyData && !localStorage.getItem(K.recovery)) {
    localStorage.setItem(K.recovery, legacyData);
  }
}

function migrateReminders(): void {
  const legacyData = localStorage.getItem(K.legacy.remindersData);
  
  if (legacyData && !localStorage.getItem(K.reminders)) {
    localStorage.setItem(K.reminders, legacyData);
  }
}

function migrateMeasurements(): void {
  const legacyData = localStorage.getItem(K.legacy.measurementsData);
  
  if (legacyData && !localStorage.getItem(K.measurements)) {
    localStorage.setItem(K.measurements, legacyData);
  }
}

function migrateMeditation(): void {
  const legacyData = localStorage.getItem(K.legacy.meditationData) ||
                    localStorage.getItem(K.legacy.meditation); // PWA format
  
  if (legacyData && !localStorage.getItem(K.meditation)) {
    try {
      const parsed = JSON.parse(legacyData);
      console.log('Migrating meditation data:', parsed);
      
      // If it's already an array (PWA format), keep as-is
      if (Array.isArray(parsed)) {
        localStorage.setItem(K.meditation, legacyData);
      } else {
        const migrated = {
          logs: parsed || {},
          customTypes: [],
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(K.meditation, JSON.stringify(migrated));
      }
      console.log('✅ Meditation migrated successfully');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Failed to migrate meditation:', error);
      }
    }
  }
}

function migrateSupplements(): void {
  const legacyData = localStorage.getItem(K.legacy.supplementsData);
  
  if (legacyData && !localStorage.getItem(K.supplements)) {
    localStorage.setItem(K.supplements, legacyData);
  }
}

function migrateEnergyLevel(): void {
  const legacyData = localStorage.getItem(K.legacy.energyLevelData);
  
  if (legacyData && !localStorage.getItem(K.energyLevel)) {
    localStorage.setItem(K.energyLevel, legacyData);
  }
}

function cleanupLegacyKeys(): void {
  // Remove legacy keys after successful migration
  Object.values(K.legacy).forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Remove individual goal keys
  const goalKeys = [
    'fitcircle_goal_hydration',
    'fitcircle_goal_meditation', 
    'fitcircle_goal_fasting',
    'fitcircle_goal_weight',
    'fitcircle_goal_bodyFat'
  ];
  
  goalKeys.forEach(key => {
    localStorage.removeItem(key);
  });
}