// Emergency debug script to check current workout data state
console.log('=== EMERGENCY WORKOUT DEBUG ===');

// Check current workout data
const currentWorkouts = localStorage.getItem('fitcircle:workouts');
console.log('Current fitcircle:workouts:', currentWorkouts);

if (currentWorkouts) {
  try {
    const parsed = JSON.parse(currentWorkouts);
    console.log('Parsed workout data:', parsed);
    console.log('Number of workouts:', Object.keys(parsed.workouts || {}).length);
    console.log('Number of daily logs:', Object.keys(parsed.dailyLogs || {}).length);
    console.log('Number of journal entries:', Object.keys(parsed.journalEntries || {}).length);
  } catch (e) {
    console.error('Error parsing current workout data:', e);
  }
}

// Look for ANY key that might contain workout data
const allKeys = Object.keys(localStorage);
const possibleWorkoutKeys = allKeys.filter(key => 
  key.toLowerCase().includes('workout') ||
  key.toLowerCase().includes('exercise') ||
  key.toLowerCase().includes('fitcircle_goals') ||
  key.toLowerCase().includes('daily') ||
  key.toLowerCase().includes('log')
);

console.log('All possible workout-related keys:', possibleWorkoutKeys);

// Sample each key to understand the data
possibleWorkoutKeys.forEach(key => {
  const data = localStorage.getItem(key);
  if (data) {
    console.log(`${key}: ${data.length} characters`);
    try {
      const parsed = JSON.parse(data);
      if (typeof parsed === 'object' && parsed !== null) {
        console.log(`${key} structure:`, Object.keys(parsed));
        
        // Look for workout-like properties
        if (parsed.workouts || parsed.dailyLogs || parsed.journalEntries) {
          console.log(`🎯 POTENTIAL WORKOUT DATA FOUND IN ${key}:`, parsed);
        }
      }
    } catch (e) {
      // Not JSON, show first 100 chars
      console.log(`${key} (non-JSON):`, data.substring(0, 100));
    }
  }
});

console.log('=== DEBUG COMPLETE ===');