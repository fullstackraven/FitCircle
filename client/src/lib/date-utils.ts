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
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Gets a date string from a Date object in local phone time
 * Format: YYYY-MM-DD
 */
export function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Gets current time in local phone time
 * Format: HH:MM AM/PM
 */
export function getCurrentTime(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Gets current time in 24-hour format for input fields in local phone time
 * Format: HH:MM
 */
export function getCurrentTime24(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Converts a date string to local phone time date
 * Input: YYYY-MM-DD string or MM/DD/YYYY string (for backward compatibility)
 * Output: Date object in local time
 */
export function parseLocalDate(dateString: string): Date {
  // Handle both YYYY-MM-DD and MM/DD/YYYY formats
  if (dateString.includes("/")) {
    // Handle MM/DD/YYYY format (legacy meditation entries)
    const [month, day, year] = dateString.split("/").map(Number);
    return new Date(year, month - 1, day);
  } else {
    // Handle YYYY-MM-DD format (standard)
    const [year, month, day] = dateString.split("-").map(Number);
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
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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
export function groupLogsByMonth<T>(
  logs: T[] | { [key: string]: T },
  dateField: string = "date",
): { [monthName: string]: T[] } {
  const monthGroups: { [monthName: string]: T[] } = {};

  // Handle object-based logs (like hydration)
  if (!Array.isArray(logs)) {
    Object.entries(logs).forEach(([dateKey, log]) => {
      const date = parseLocalDate(dateKey);
      const monthKey = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
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
      if (dateField === "startDate") {
        dateString = log.startDate; // For fasting logs
      } else {
        dateString = log[dateField]; // For cardio, meditation, etc.
      }

      if (dateString) {
        const date = parseLocalDate(dateString);
        const monthKey = date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
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
      // Parse "Month Year" format (e.g., "October 2025")
      // Create a date from "1 Month Year" format which is more reliable
      const dateA = new Date("1 " + a);
      const dateB = new Date("1 " + b);
      return dateB.getTime() - dateA.getTime();
    })
    .forEach((month) => {
      sortedMonths[month] = monthGroups[month];
    });

  return sortedMonths;
}

/**
 * Calculates the number of days between two date strings (inclusive)
 * Input: YYYY-MM-DD format strings
 * Output: Number of days including both start and end dates
 */
export function getDaysBetweenInclusive(
  startDateStr: string,
  endDateStr: string,
): number {
  const ordinal = (value: string) => {
    const date = parseLocalDate(value);
    return (
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000
    );
  };
  const days = ordinal(endDateStr) - ordinal(startDateStr) + 1;
  return Number.isFinite(days) ? Math.max(0, days) : 0;
}

/**
 * Calculates all-time average fasting hours including days with no fasting (0 hours)
 * Input: Array of fasting logs with startDate and duration fields
 * Output: { averageHours: number, totalDays: number, totalHours: number }
 */
function historicalAverage(records: { date: unknown; value: unknown }[]) {
  const valid = records.flatMap((record) => {
    if (typeof record.date !== "string") return [];
    const date = parseLocalDate(record.date),
      key = getDateString(date);
    const original = record.date.includes("/")
      ? record.date.split("/").map(Number)
      : null;
    const expected = original
      ? [
          original[2],
          String(original[0]).padStart(2, "0"),
          String(original[1]).padStart(2, "0"),
        ].join("-")
      : record.date;
    const value =
      typeof record.value === "number" ||
      (typeof record.value === "string" && record.value.trim() !== "")
        ? Number(record.value)
        : NaN;
    return key === expected &&
      key <= getTodayString() &&
      Number.isFinite(value) &&
      value >= 0
      ? [{ date: key, value }]
      : [];
  });
  const dates = valid.map((record) => record.date).sort();
  if (!dates.length)
    return {
      total: 0,
      totalDays: 0,
      average: 0,
      loggedDays: 0,
      loggedDayAverage: 0,
    };
  const sum = valid.reduce((sum, record) => sum + record.value, 0),
    total = Number.isFinite(sum) ? sum : 0;
  const totalDays = getDaysBetweenInclusive(dates[0], getTodayString()),
    loggedDays = new Set(dates).size;
  return {
    total,
    totalDays,
    average: total / totalDays,
    loggedDays,
    loggedDayAverage: total / loggedDays,
  };
}
const tenth = (value: number) =>
  Number.isFinite(value) && Number.isFinite(value * 10)
    ? Math.round(value * 10) / 10
    : 0;
export function getAllTimeFastingAverage(
  logs: { startDate: string; duration: number }[],
) {
  const stats = historicalAverage(
    (Array.isArray(logs) ? logs : []).map((log: any) => ({
      date: log?.endDate ?? log?.startDate,
      value: Number(log?.duration) / 60,
    })),
  );
  return {
    averageHours: tenth(stats.average),
    totalDays: stats.totalDays,
    totalHours: tenth(stats.total),
  };
}
export function getAllTimeHydrationAverage(logs: {
  [date: string]: { totalOz: number };
}) {
  const records = Object.entries(logs ?? {}).map(
    ([date, log]: [string, any]) => ({
      date,
      value: Array.isArray(log?.entries)
        ? log.entries.reduce(
            (sum: number, e: any) =>
              sum +
              (Number.isFinite(Number(e?.amount)) && Number(e?.amount) > 0
                ? Number(e.amount)
                : 0),
            0,
          )
        : log?.totalOz,
    }),
  );
  const stats = historicalAverage(records);
  return {
    averageOz: tenth(stats.average),
    totalDays: stats.totalDays,
    totalOz: tenth(stats.total),
  };
}
export function getAllTimeMeditationAverage(
  logs: { date: string; duration: number }[],
) {
  const stats = historicalAverage(
    (Array.isArray(logs) ? logs : []).map((log) => ({
      date: log?.date,
      value: log?.duration,
    })),
  );
  return {
    averageMinutes: tenth(stats.average),
    totalDays: stats.totalDays,
    totalMinutes: tenth(stats.total),
  };
}
export function getAllTimeCardioAverage(
  entries: { date: string; duration: number; distance?: number }[],
) {
  const values = Array.isArray(entries) ? entries : [];
  const duration = historicalAverage(
    values.map((entry) => ({ date: entry?.date, value: entry?.duration })),
  );
  const distance = historicalAverage(
    values.map((entry) => ({ date: entry?.date, value: entry?.distance })),
  );
  const dates = values
    .filter((entry) => {
      const date = entry?.date;
      return (
        typeof date === "string" &&
        getDateString(parseLocalDate(date)) === date &&
        date <= getTodayString() &&
        ((Number.isFinite(Number(entry.duration)) &&
          Number(entry.duration) >= 0) ||
          (Number.isFinite(Number(entry.distance)) &&
            Number(entry.distance) >= 0))
      );
    })
    .map((entry) => entry.date)
    .sort();
  const totalDays = dates.length
    ? getDaysBetweenInclusive(dates[0], getTodayString())
    : 0;
  return {
    averageDuration: totalDays ? tenth(duration.total / totalDays) : 0,
    averageDistance: totalDays ? tenth(distance.total / totalDays) : 0,
    totalDays,
  };
}
