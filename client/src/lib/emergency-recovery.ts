/**
 * EMERGENCY DATA RECOVERY SYSTEM
 * Recovers PWA data that may have been imported with mismatched storage keys
 */

import { STORAGE_KEYS } from './keys';
import { set } from './safeStorage';
import { getTodayString } from './date-utils';

export interface RecoveryReport {
  found: string[];
  recovered: string[];
  failed: string[];
  warnings: string[];
}

/**
 * Comprehensive data recovery from any possible PWA import format
 */
export function emergencyDataRecovery(): RecoveryReport {
  const report: RecoveryReport = {
    found: [],
    recovered: [],
    failed: [],
    warnings: []
  };

  console.log('🚨 STARTING EMERGENCY DATA RECOVERY...');

  // Get all localStorage keys
  const allKeys = Object.keys(localStorage);
  console.log('All localStorage keys:', allKeys);

  // Try to recover workouts from multiple possible sources
  recoverWorkouts(allKeys, report);
  
  // Try to recover hydration data
  recoverHydration(allKeys, report);
  
  // Try to recover meditation data  
  recoverMeditation(allKeys, report);
  
  // Try to recover fasting data
  recoverFasting(allKeys, report);
  
  // Try to recover journal data
  recoverJournal(allKeys, report);

  console.log('🔄 RECOVERY COMPLETE:', report);
  return report;
}

function recoverWorkouts(allKeys: string[], report: RecoveryReport): void {
  // Possible workout key variations from PWA - exhaustive search
  const workoutKeyVariations = [
    'fitcircle_workouts',
    'workouts', 
    'WORKOUT_LOGS',
    'workout-tracker-logs',
    'fitcircle:workouts_backup',
    'workoutData',
    'workout_data',
    'fitcircle_workout_data',
    'fitcircle_workout_logs',
    'fitcircle_daily_logs',
    'fitcircle_exercises'
  ];

  for (const key of workoutKeyVariations) {
    if (allKeys.includes(key)) {
      report.found.push(`workouts: ${key}`);
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          console.log(`Found workout data in ${key}:`, parsed);
          
          // Check if this looks like valid workout data
          if (isValidWorkoutData(parsed)) {
            // Convert to current format and save
            const converted = convertToCurrentWorkoutFormat(parsed);
            set(STORAGE_KEYS.workouts, converted);
            report.recovered.push(`workouts from ${key}`);
            console.log('✅ Workouts recovered successfully');
            return; // Stop after first successful recovery
          }
        }
      } catch (error) {
        report.failed.push(`workouts: ${key} - ${error}`);
      }
    }
  }
}

function recoverHydration(allKeys: string[], report: RecoveryReport): void {
  const hydrationKeyVariations = [
    'fitcircle_hydration',
    'hydration',
    'HYDRATION_LOGS', 
    'hydrationData',
    'fitcircle:hydration_backup'
  ];

  for (const key of hydrationKeyVariations) {
    if (allKeys.includes(key)) {
      report.found.push(`hydration: ${key}`);
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          console.log(`Found hydration data in ${key}:`, parsed);
          
          if (isValidHydrationData(parsed)) {
            set(STORAGE_KEYS.hydration, parsed);
            report.recovered.push(`hydration from ${key}`);
            console.log('✅ Hydration recovered successfully');
            return;
          }
        }
      } catch (error) {
        report.failed.push(`hydration: ${key} - ${error}`);
      }
    }
  }
}

function recoverMeditation(allKeys: string[], report: RecoveryReport): void {
  const meditationKeyVariations = [
    'fitcircle_meditation',
    'fitcircle_meditation_logs',
    'meditation',
    'MEDITATION_DATA',
    'meditationData',
    'fitcircle:meditation_backup'
  ];

  for (const key of meditationKeyVariations) {
    if (allKeys.includes(key)) {
      report.found.push(`meditation: ${key}`);
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          console.log(`Found meditation data in ${key}:`, parsed);
          
          if (isValidMeditationData(parsed)) {
            set(STORAGE_KEYS.meditation, parsed);
            report.recovered.push(`meditation from ${key}`);
            console.log('✅ Meditation recovered successfully');
            return;
          }
        }
      } catch (error) {
        report.failed.push(`meditation: ${key} - ${error}`);
      }
    }
  }
}

function recoverFasting(allKeys: string[], report: RecoveryReport): void {
  const fastingKeyVariations = [
    'fitcircle_fasting',
    'fitcircle_fasting_logs',
    'fasting',
    'FASTING_LOGS',
    'fastingData',
    'fitcircle:fasting_backup'
  ];

  for (const key of fastingKeyVariations) {
    if (allKeys.includes(key)) {
      report.found.push(`fasting: ${key}`);
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          console.log(`Found fasting data in ${key}:`, parsed);
          
          if (isValidFastingData(parsed)) {
            set(STORAGE_KEYS.fasting, parsed);
            report.recovered.push(`fasting from ${key}`);
            console.log('✅ Fasting recovered successfully');
            return;
          }
        }
      } catch (error) {
        report.failed.push(`fasting: ${key} - ${error}`);
      }
    }
  }
}

function recoverJournal(allKeys: string[], report: RecoveryReport): void {
  const journalKeyVariations = [
    'fitcircle_journal',
    'journal',
    'journalEntries',
    'daily_journal',
    'fitcircle:journal_backup',
    'fitcircle_journal_entries',
    'fitcircle_daily_journal'
  ];

  for (const key of journalKeyVariations) {
    if (allKeys.includes(key)) {
      report.found.push(`journal: ${key}`);
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          console.log(`Found journal data in ${key}:`, parsed);
          
          // Journal data should be merged into workout data
          if (isValidJournalData(parsed)) {
            mergeJournalIntoWorkouts(parsed);
            report.recovered.push(`journal from ${key}`);
            console.log('✅ Journal recovered successfully');
            return;
          }
        }
      } catch (error) {
        report.failed.push(`journal: ${key} - ${error}`);
      }
    }
  }
}

// Validation functions
function isValidWorkoutData(data: any): boolean {
  return data && (
    (data.workouts && typeof data.workouts === 'object') ||
    Array.isArray(data) ||
    (data.dailyLogs && typeof data.dailyLogs === 'object')
  );
}

function isValidHydrationData(data: any): boolean {
  return data && (
    data.currentDayOz !== undefined ||
    data.dailyGoalOz !== undefined ||
    data.logs !== undefined
  );
}

function isValidMeditationData(data: any): boolean {
  return data && (
    Array.isArray(data) ||
    (data.logs && typeof data.logs === 'object')
  );
}

function isValidFastingData(data: any): boolean {
  return data && (
    Array.isArray(data) ||
    (data.logs && typeof data.logs === 'object')
  );
}

function isValidJournalData(data: any): boolean {
  return data && typeof data === 'object' && Object.keys(data).length > 0;
}

// Conversion functions
function convertToCurrentWorkoutFormat(data: any): any {
  // If it's already in the right format, return as-is
  if (data.workouts && data.dailyLogs) {
    return data;
  }
  
  // If it's an array of workouts, convert to object format
  if (Array.isArray(data)) {
    const workouts: any = {};
    data.forEach((workout: any) => {
      if (workout.id) {
        workouts[workout.id] = workout;
      }
    });
    return {
      workouts,
      dailyLogs: {},
      journalEntries: {},
      lastDate: getTodayString()
    };
  }
  
  // If it has a different structure, try to extract what we can
  return {
    workouts: data.workouts || {},
    dailyLogs: data.dailyLogs || {},
    journalEntries: data.journalEntries || {},
    lastDate: data.lastDate || getTodayString()
  };
}

function mergeJournalIntoWorkouts(journalData: any): void {
  const currentWorkouts = JSON.parse(localStorage.getItem(STORAGE_KEYS.workouts) || '{"workouts":{},"dailyLogs":{},"journalEntries":{}}');
  
  // Merge journal entries
  currentWorkouts.journalEntries = {
    ...currentWorkouts.journalEntries,
    ...journalData
  };
  
  set(STORAGE_KEYS.workouts, currentWorkouts);
}