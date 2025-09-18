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
 * Input: YYYY-MM-DD string
 * Output: Date object in user's local timezone
 */
export function parseLocalDate(dateString: string): Date {
  // Parse as local date, not UTC
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
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