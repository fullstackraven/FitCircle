/**
 * EMERGENCY DATA RECOVERY SCRIPT
 * This script will check for and recover data that may have been lost due to storage key changes
 */

// Check if we're running in browser
if (typeof localStorage !== 'undefined') {
  console.log('🚨 EMERGENCY DATA RECOVERY STARTING...');
  
  // List all localStorage keys
  const allKeys = Object.keys(localStorage);
  console.log('All localStorage keys found:', allKeys);
  
  // Check for legacy workout data
  const legacyWorkoutKeys = allKeys.filter(key => 
    key.includes('workout') || key.includes('WORKOUT') || key === 'fitcircle_workouts'
  );
  console.log('Legacy workout keys:', legacyWorkoutKeys);
  
  // Check for legacy hydration data
  const legacyHydrationKeys = allKeys.filter(key => 
    key.includes('hydration') || key.includes('HYDRATION') || key === 'fitcircle_hydration'
  );
  console.log('Legacy hydration keys:', legacyHydrationKeys);
  
  // Check for legacy meditation data
  const legacyMeditationKeys = allKeys.filter(key => 
    key.includes('meditation') || key.includes('MEDITATION') || key === 'fitcircle_meditation'
  );
  console.log('Legacy meditation keys:', legacyMeditationKeys);
  
  // Check for legacy fasting data
  const legacyFastingKeys = allKeys.filter(key => 
    key.includes('fasting') || key.includes('FASTING') || key === 'fitcircle_fasting'
  );
  console.log('Legacy fasting keys:', legacyFastingKeys);
  
  // Check for journal data
  const journalKeys = allKeys.filter(key => 
    key.includes('journal') || key.includes('JOURNAL')
  );
  console.log('Journal keys:', journalKeys);
  
  // Check current new format keys
  const currentKeys = allKeys.filter(key => key.startsWith('fitcircle:'));
  console.log('Current format keys:', currentKeys);
  
  // Show data samples
  legacyWorkoutKeys.forEach(key => {
    const data = localStorage.getItem(key);
    console.log(`${key} data length:`, data ? data.length : 'null');
    if (data && data.length < 500) {
      console.log(`${key} sample:`, data.substring(0, 200));
    }
  });
  
  console.log('🔍 RECOVERY ANALYSIS COMPLETE - Check console for details');
}