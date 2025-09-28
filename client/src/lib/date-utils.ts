// Master date utilities for consistent app-wide date handling
// All pages and hooks MUST use these functions for date operations
// RESET TIME: All daily resets happen at 12am local phone time

/**
 * Gets today's date string in local phone time
 * Format: YYYY-MM-DD
 * This is the master function for getting "today" throughout the app
 * Resets at 12am local time every day
 */
export function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets a date string from a Date object in local phone time
 * Format: YYYY-MM-DD
 */
export function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets current time in local phone time
 * Format: HH:MM AM/PM
 */
export function getCurrentTime(): string {
  return new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

/**
 * Gets current time in 24-hour format for input fields in local phone time
 * Format: HH:MM
 */
export function getCurrentTime24(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Converts a date string to local phone time date
 * Input: YYYY-MM-DD string or MM/DD/YYYY string (for backward compatibility)
 * Output: Date object in local time
 */
export function parseLocalDate(dateString: string): Date {
  // Handle both YYYY-MM-DD and MM/DD/YYYY formats
  if (dateString.includes('/')) {
    // Handle MM/DD/YYYY format (legacy meditation entries)
    const [month, day, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  } else {
    // Handle YYYY-MM-DD format (standard)
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
}

/**
 * Gets yesterday's date string in local phone time
 * Format: YYYY-MM-DD
 */
export function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateString(yesterday);
}

/**
 * Gets a formatted date for display
 * Format: "Jul 31, 2025"
 */
export function getDisplayDate(dateString: string): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

/**
 * Checks if a date string is today in user's local timezone
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayString();
}

/**
 * Checks if a date string is yesterday in user's local timezone
 */
export function isYesterday(dateString: string): boolean {
  return dateString === getYesterdayString();
}

/**
 * Groups logs by month and returns only months that have data
 * Format: "September 2025", "August 2025", etc.
 * @param logs - Array of logs or object with date keys
 * @param dateField - Field name containing the date (for array logs) or 'key' for object logs
 * @returns Object with month names as keys and arrays of logs as values
 */
export function groupLogsByMonth<T>(logs: T[] | { [key: string]: T }, dateField: string = 'date'): { [monthName: string]: T[] } {
  const monthGroups: { [monthName: string]: T[] } = {};
  
  // Handle object-based logs (like hydration)
  if (!Array.isArray(logs)) {
    Object.entries(logs).forEach(([dateKey, log]) => {
      const date = parseLocalDate(dateKey);
      const monthKey = date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      monthGroups[monthKey].push(log);
    });
  } 
  // Handle array-based logs (like cardio, fasting, meditation)
  else {
    logs.forEach((log: any) => {
      let dateString: string;
      
      // Handle different date field names
      if (dateField === 'startDate') {
        dateString = log.startDate; // For fasting logs
      } else {
        dateString = log[dateField]; // For cardio, meditation, etc.
      }
      
      if (dateString) {
        const date = parseLocalDate(dateString);
        const monthKey = date.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
        
        if (!monthGroups[monthKey]) {
          monthGroups[monthKey] = [];
        }
        monthGroups[monthKey].push(log);
      }
    });
  }
  
  // Sort months from newest to oldest
  const sortedMonths: { [monthName: string]: T[] } = {};
  Object.keys(monthGroups)
    .sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB.getTime() - dateA.getTime();
    })
    .forEach(month => {
      sortedMonths[month] = monthGroups[month];
    });
  
  return sortedMonths;
}

/**
 * Calculates the number of days between two date strings (inclusive)
 * Input: YYYY-MM-DD format strings
 * Output: Number of days including both start and end dates
 */
export function getDaysBetweenInclusive(startDateStr: string, endDateStr: string): number {
  const startDate = parseLocalDate(startDateStr);
  const endDate = parseLocalDate(endDateStr);
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // +1 to make it inclusive
}

/**
 * Calculates all-time average fasting hours including days with no fasting (0 hours)
 * Input: Array of fasting logs with startDate and duration fields
 * Output: { averageHours: number, totalDays: number, totalHours: number }
 */
export function getAllTimeFastingAverage(logs: { startDate: string; duration: number }[]): { averageHours: number; totalDays: number; totalHours: number } {
  if (logs.length === 0) {
    return { averageHours: 0, totalDays: 0, totalHours: 0 };
  }
  
  // Calculate total hours from valid fasting logs
  let totalHours = 0;
  const startDates: string[] = [];
  
  logs.forEach(log => {
    const durationHours = log.duration / 60;
    if (durationHours > 0 && durationHours < 48) { // Valid fasting duration
      totalHours += durationHours;
      startDates.push(log.startDate);
    }
  });
  
  if (startDates.length === 0) {
    return { averageHours: 0, totalDays: 0, totalHours: 0 };
  }
  
  // Find date range using string comparison (timezone-safe)
  const sortedDates = startDates.sort();
  const firstDate = sortedDates[0];
  const today = getTodayString();
  
  // Calculate total days from first log to today (inclusive)
  const totalDays = getDaysBetweenInclusive(firstDate, today);
  const averageHours = totalHours / totalDays;
  
  return {
    averageHours: Math.round(averageHours * 10) / 10, // Round to 1 decimal
    totalDays,
    totalHours: Math.round(totalHours * 10) / 10
  };
}

/**
 * Calculates all-time average hydration including days with no hydration (0 oz)
 * Input: Object with date keys and totalOz values
 * Output: { averageOz: number, totalDays: number, totalOz: number }
 */
export function getAllTimeHydrationAverage(logs: { [date: string]: { totalOz: number } }): { averageOz: number; totalDays: number; totalOz: number } {
  const logEntries = Object.entries(logs);
  if (logEntries.length === 0) {
    return { averageOz: 0, totalDays: 0, totalOz: 0 };
  }
  
  // Find date range using string comparison (timezone-safe)
  const dates = logEntries.map(([date]) => date).sort();
  const firstDate = dates[0];
  const today = getTodayString();
  
  // Calculate total days from first log to today (inclusive)
  const totalDays = getDaysBetweenInclusive(firstDate, today);
  
  // Calculate total oz across all logged days
  const totalOz = logEntries.reduce((sum, [, log]) => sum + (log.totalOz || 0), 0);
  const averageOz = totalOz / totalDays;
  
  return {
    averageOz: Math.round(averageOz * 10) / 10, // Round to 1 decimal
    totalDays,
    totalOz: Math.round(totalOz * 10) / 10
  };
}

/**
 * Calculates all-time average meditation including days with no meditation (0 minutes)  
 * Input: Array of meditation logs with date and duration fields
 * Output: { averageMinutes: number, totalDays: number, totalMinutes: number }
 */
export function getAllTimeMeditationAverage(logs: { date: string; duration: number }[]): { averageMinutes: number; totalDays: number; totalMinutes: number } {
  if (logs.length === 0) {
    return { averageMinutes: 0, totalDays: 0, totalMinutes: 0 };
  }
  
  // Group by date using timezone-safe parsing
  const dailyTotals: { [date: string]: number } = {};
  logs.forEach(session => {
    const date = parseLocalDate(session.date);
    const dateKey = date.toLocaleDateString('en-CA'); // YYYY-MM-DD format, timezone-safe
    dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + session.duration;
  });
  
  const dates = Object.keys(dailyTotals).sort();
  if (dates.length === 0) {
    return { averageMinutes: 0, totalDays: 0, totalMinutes: 0 };
  }
  
  const firstDate = dates[0];
  const today = getTodayString();
  
  // Calculate total days from first log to today (inclusive)
  const totalDays = getDaysBetweenInclusive(firstDate, today);
  
  // Calculate total minutes across all logged days
  const totalMinutes = Object.values(dailyTotals).reduce((sum, minutes) => sum + minutes, 0);
  const averageMinutes = totalMinutes / totalDays;
  
  return {
    averageMinutes: Math.round(averageMinutes * 10) / 10, // Round to 1 decimal
    totalDays,
    totalMinutes: Math.round(totalMinutes * 10) / 10
  };
}

/**
 * Calculates all-time average cardio including days with no cardio (0 duration/distance)
 * Input: Array of cardio entries with date, duration, and distance fields
 * Output: { averageDuration: number, averageDistance: number, totalDays: number }
 */
export function getAllTimeCardioAverage(entries: { date: string; duration: number; distance?: number }[]): { averageDuration: number; averageDistance: number; totalDays: number } {
  if (entries.length === 0) {
    return { averageDuration: 0, averageDistance: 0, totalDays: 0 };
  }
  
  // Group by date and sum daily totals
  const dailyTotals: { [date: string]: { duration: number; distance: number } } = {};
  entries.forEach(entry => {
    const dateKey = entry.date; // Already in YYYY-MM-DD format
    if (!dailyTotals[dateKey]) {
      dailyTotals[dateKey] = { duration: 0, distance: 0 };
    }
    dailyTotals[dateKey].duration += entry.duration || 0;
    dailyTotals[dateKey].distance += entry.distance || 0;
  });
  
  const dates = Object.keys(dailyTotals).sort();
  const firstDate = dates[0];
  const today = getTodayString();
  
  // Calculate total days from first log to today (inclusive)
  const totalDays = getDaysBetweenInclusive(firstDate, today);
  
  // Calculate totals across all logged days
  const totalDuration = Object.values(dailyTotals).reduce((sum, day) => sum + day.duration, 0);
  const totalDistance = Object.values(dailyTotals).reduce((sum, day) => sum + day.distance, 0);
  
  const averageDuration = totalDuration / totalDays;
  const averageDistance = totalDistance / totalDays;
  
  return {
    averageDuration: Math.round(averageDuration * 10) / 10, // Round to 1 decimal
    averageDistance: Math.round(averageDistance * 10) / 10, // Round to 1 decimal
    totalDays
  };
}