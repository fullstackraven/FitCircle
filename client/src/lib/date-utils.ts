// Master timezone and date utilities for consistent app-wide date handling
// All pages and hooks MUST use these functions for date operations

/**
 * Gets today's date string in the user's local timezone
 * Format: YYYY-MM-DD
 * This is the master function for getting "today" throughout the app
 */
export function getTodayString(): string {
  const today = new Date();
  // Use toLocaleDateString to ensure we get the user's local date regardless of timezone
  const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets a date string from a Date object in the user's local timezone
 * Format: YYYY-MM-DD
 */
export function getDateString(date: Date): string {
  // Ensure we get the local date, not UTC
  const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets current time in user's local timezone  
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
 * Gets current time in 24-hour format for input fields
 * Format: HH:MM
 */
export function getCurrentTime24(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Converts a date string to user's local date (handles timezone issues)
 * Input: YYYY-MM-DD string or MM/DD/YYYY string (for backward compatibility)
 * Output: Date object in user's local timezone
 */
export function parseLocalDate(dateString: string): Date {
  // Handle both YYYY-MM-DD and MM/DD/YYYY formats
  if (dateString.includes('/')) {
    // Handle MM/DD/YYYY format (legacy meditation entries)
    const [month, day, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  } else {
    // Handle YYYY-MM-DD format (standard)
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  }
}

/**
 * Gets yesterday's date string in user's local timezone
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