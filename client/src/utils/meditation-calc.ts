// Shared meditation calculation utilities
// This ensures Goals page and Meditation page use identical logic

export interface MeditationSession {
  duration: number;
  completedAt?: string;
  date?: string;
}

export const calculateMeditation7DayAverage = (logs: MeditationSession[]): number => {
  if (!logs || !Array.isArray(logs) || logs.length === 0) return 0;
  
  // Group sessions by date and calculate daily totals for last 7 days
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  
  const dailyTotals: { [date: string]: number } = {};
  
  logs.forEach((session) => {
    const dateValue = session.completedAt || session.date;
    if (dateValue) {
      const sessionDate = new Date(dateValue);
      if (sessionDate >= last7Days && session.duration) {
        const dateKey = sessionDate.toISOString().split('T')[0];
        dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + session.duration;
      }
    }
  });
  
  // Calculate average across all days (including zero days)
  const dailyValues = Object.values(dailyTotals);
  const totalMinutes = dailyValues.reduce((sum, minutes) => sum + minutes, 0);
  
  return totalMinutes / 7; // Average over 7 days regardless of how many had sessions
};

export const calculateMeditationProgress = (logs: MeditationSession[], goalMinutes: number): number => {
  if (goalMinutes === 0) return 0;
  const averageMinutes = calculateMeditation7DayAverage(logs);
  return Math.min(100, (averageMinutes / goalMinutes) * 100);
};

export const getMeditationGoal = (): number => {
  const goalValue = localStorage.getItem('fitcircle_goal_meditation');
  return goalValue ? parseFloat(goalValue) : 10;
};

export const setMeditationGoal = (goalMinutes: number): void => {
  localStorage.setItem('fitcircle_goal_meditation', goalMinutes.toString());
  
  // Trigger storage event for cross-page synchronization
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'fitcircle_goal_meditation',
    newValue: goalMinutes.toString(),
    oldValue: localStorage.getItem('fitcircle_goal_meditation'),
    storageArea: localStorage
  }));
};

export const getMeditationLogs = (): MeditationSession[] => {
  const logsString = localStorage.getItem('fitcircle_meditation_logs');
  if (logsString) {
    try {
      const logs = JSON.parse(logsString);
      return Array.isArray(logs) ? logs : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};