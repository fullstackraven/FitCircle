import { useWellnessClock } from "./use-preserved-wellness";
import {
  cardioProgress,
  historicalStats,
  localDay,
  dailyTotals,
  percentage,
  weekDates,
  windowStats,
  amount,
} from "@/lib/wellness-progress";
import { useState, useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/storage-utils";
import {
  loadStoredCardio,
  StoredCardioDataError,
} from "@/lib/cardio-initialization";
import {
  getTodayString,
  getAllTimeCardioAverage,
  getCurrentTime,
} from "@/lib/date-utils";

export interface CardioSession {
  id: string;
  time: string;
  type: string;
  duration: number; // in minutes
  distance?: number; // in miles (optional)
  notes?: string;
}

export interface CardioDailyLog {
  date: string;
  totalDuration: number;
  totalDistance: number;
  sessions: CardioSession[];
}

// Legacy interface for migration
export interface CardioEntry {
  id: string;
  date: string;
  type: string;
  duration: number; // in minutes
  distance?: number; // in miles (optional)
  notes?: string;
  timestamp: number;
}

export interface CardioGoal {
  type: "distance" | "duration";
  target: number; // miles per day or minutes per day
  period: "day" | "week"; // Support both for backward compatibility
}

export interface CardioData {
  dailyLogs: { [date: string]: CardioDailyLog };
  goal: CardioGoal;
  goalUserSet: boolean; // Track if user has explicitly set a goal
  customTypes: string[];
  lastDate: string;
  currentDayDuration: number;
  currentDayDistance: number;
  // Legacy field for migration
  entries?: CardioEntry[];
}

const defaultCardioTypes = [
  "cycling",
  "swimming",
  "rucking",
  "walking",
  "running",
  "HIIT",
  "rowing",
  "treadmill",
];

export function useCardio() {
  const now = useWellnessClock();
  const [initial] = useState(() => {
    let storage: Storage;
    try {
      storage = localStorage;
    } catch {
      throw new StoredCardioDataError({}, "unavailable");
    }
    return loadStoredCardio(storage, getTodayString());
  });
  const [data, setData] = useState<CardioData>(initial.data);

  // Only explicit changes (or a later date rollover) can persist. Neither
  // initialization, migration nor StrictMode effect replay saves fallback data.
  useEffect(() => {
    if (data === initial.data) return;
    try {
      let saved =
        data.goal === initial.data.goal && initial.originalGoal
          ? { ...data, goal: initial.originalGoal }
          : data;
      if (initial.legacySource) {
        // The alias remains byte-exact. Persist its edited daily-log projection
        // using the existing canonical format; raw legacy entries may contain
        // numeric strings which the canonical backup validator cannot accept.
        const { entries: _legacyEntries, ...canonical } = saved;
        saved = canonical;
      }
      localStorage.setItem(STORAGE_KEYS.CARDIO, JSON.stringify(saved));
    } catch (error) {
      console.error("Failed to save cardio data:", error);
    }
  }, [data, initial]);

  const addCardioEntry = (
    type: string,
    duration: number,
    distance?: number,
    notes?: string,
  ) => {
    if (
      !Number.isFinite(duration) ||
      duration < 0 ||
      !Number.isFinite(distance ?? 0) ||
      (distance ?? 0) < 0 ||
      (!duration && !distance)
    )
      return false;
    const today = getTodayString();
    const currentTime = getCurrentTime(); // Use consistent time format

    const newSession: CardioSession = {
      id: Date.now().toString(),
      time: currentTime,
      type,
      duration: Math.floor(duration || 0),
      distance: distance ? Math.round(distance * 10) / 10 : distance,
      notes,
    };

    setData((prev) => {
      const todayLog = prev.dailyLogs[today] || {
        date: today,
        totalDuration: 0,
        totalDistance: 0,
        sessions: [],
      };

      const updatedLog = {
        ...todayLog,
        totalDuration: todayLog.totalDuration + newSession.duration,
        totalDistance: todayLog.totalDistance + (newSession.distance || 0),
        sessions: [...todayLog.sessions, newSession],
      };

      return {
        ...prev,
        currentDayDuration: updatedLog.totalDuration,
        lastDate: today,
        currentDayDistance: updatedLog.totalDistance,
        dailyLogs: {
          ...prev.dailyLogs,
          [today]: updatedLog,
        },
      };
    });
  };

  const updateCardioSession = (
    date: string,
    id: string,
    updates: Partial<CardioSession>,
  ) => {
    setData((prev) => {
      const dayLog = prev.dailyLogs[date];
      if (!dayLog) return prev;

      const oldSession = dayLog.sessions.find((s) => s.id === id);
      if (!oldSession) return prev;

      const updatedSessions = dayLog.sessions.map((session) =>
        session.id === id ? { ...session, ...updates } : session,
      );

      // Recalculate totals
      let totalDuration = 0;
      let totalDistance = 0;
      updatedSessions.forEach((session) => {
        totalDuration += session.duration;
        if (session.distance) totalDistance += session.distance;
      });

      const updatedLog = {
        ...dayLog,
        totalDuration,
        totalDistance,
        sessions: updatedSessions,
      };

      // Update current day totals if it's today
      const isToday = date === getTodayString();

      return {
        ...prev,
        currentDayDuration: isToday ? totalDuration : prev.currentDayDuration,
        currentDayDistance: isToday ? totalDistance : prev.currentDayDistance,
        dailyLogs: {
          ...prev.dailyLogs,
          [date]: updatedLog,
        },
      };
    });
  };

  const deleteCardioSession = (date: string, id: string) => {
    setData((prev) => {
      const dayLog = prev.dailyLogs[date];
      if (!dayLog) return prev;

      const sessionToDelete = dayLog.sessions.find((s) => s.id === id);
      if (!sessionToDelete) return prev;

      const updatedSessions = dayLog.sessions.filter(
        (session) => session.id !== id,
      );

      // Recalculate totals
      let totalDuration = 0;
      let totalDistance = 0;
      updatedSessions.forEach((session) => {
        totalDuration += session.duration;
        if (session.distance) totalDistance += session.distance;
      });

      const updatedLog = {
        ...dayLog,
        totalDuration,
        totalDistance,
        sessions: updatedSessions,
      };

      // Remove the log entirely if no sessions remain
      const newDailyLogs = { ...prev.dailyLogs };
      if (updatedSessions.length === 0) {
        delete newDailyLogs[date];
      } else {
        newDailyLogs[date] = updatedLog;
      }

      // Update current day totals if it's today
      const isToday = date === getTodayString();

      return {
        ...prev,
        currentDayDuration: isToday ? totalDuration : prev.currentDayDuration,
        currentDayDistance: isToday ? totalDistance : prev.currentDayDistance,
        dailyLogs: newDailyLogs,
      };
    });
  };

  const updateGoal = (goal: CardioGoal) => {
    if (!amount(goal.target)) return false;
    setData((prev) => ({
      ...prev,
      goal: { ...prev.goal, ...goal },
      goalUserSet: true, // Mark as user-set when goal is updated
    }));

    // Also write to legacy goal key for backward compatibility
    localStorage.setItem(
      "fitcircle_goal_cardio",
      JSON.stringify({ ...data.goal, ...goal }),
    );
  };

  const addCustomType = (type: string) => {
    const trimmedType = type.trim();
    if (!trimmedType || data.customTypes.includes(trimmedType)) return;

    setData((prev) => ({
      ...prev,
      customTypes: [...prev.customTypes, trimmedType],
    }));
  };

  const getAllCardioTypes = () => {
    const entryTypes = Array.from(
      new Set(
        Object.values(data.dailyLogs).flatMap((log) =>
          log.sessions.map((session) => session.type),
        ),
      ),
    );
    return [...defaultCardioTypes, ...data.customTypes, ...entryTypes]
      .filter((type, index, arr) => arr.indexOf(type) === index)
      .sort();
  };

  const getTodaysCardio = () => {
    const today = getTodayString();
    const todayLog = data.dailyLogs[today];

    if (!todayLog) {
      return {
        sessions: [],
        totalDuration: 0,
        totalDistance: 0,
        count: 0,
      };
    }

    return {
      sessions: todayLog.sessions,
      totalDuration: dailyTotals("cardioDuration", data)[today] ?? 0,
      totalDistance: dailyTotals("cardioDistance", data)[today] ?? 0,
      count: todayLog.sessions.length,
    };
  };

  const getTodaysProgress = () => {
    const progress = cardioProgress(data, now);
    return {
      progress: progress.percentage,
      remaining: progress.remaining,
      today: {
        duration: progress.totalDuration,
        distance: progress.totalDistance,
      },
    };
  };
  const getWeeklyProgress = () => {
    const duration = dailyTotals("cardioDuration", data),
      distance = dailyTotals("cardioDistance", data),
      dates = weekDates(now);
    const totalDuration = dates.reduce(
      (sum, date) => sum + amount(duration[date]),
      0,
    );
    const totalDistance = dates.reduce(
      (sum, date) => sum + amount(distance[date]),
      0,
    );
    const weeklyTarget =
      data.goal.period === "week"
        ? amount(data.goal.target)
        : amount(data.goal.target) * 7;
    const current =
      data.goal.type === "duration" ? totalDuration : totalDistance;
    return {
      totalDuration,
      totalDistance,
      weeklyTarget,
      progress: percentage(current, weeklyTarget),
      remaining: Math.max(0, weeklyTarget - current),
    };
  };
  const getLast10LogsAverage = () => {
    const totals = dailyTotals(
      data.goal.type === "duration" ? "cardioDuration" : "cardioDistance",
      data,
    );
    const stats = windowStats(totals, now);
    const dailyTarget =
        amount(data.goal.target) / (data.goal.period === "week" ? 7 : 1),
      targetGoal = dailyTarget * 10;
    return {
      average: Math.round(stats.average * 10) / 10,
      totalValue: stats.total,
      targetGoal,
      progressToGoal: percentage(stats.average, dailyTarget),
      goalProgress: percentage(stats.total, targetGoal),
      dailyTarget,
      logsCount: stats.loggedDays,
    };
  };

  const getCardioStats = () => {
    const allSessions = Object.values(data.dailyLogs).flatMap(
      (log) => log.sessions,
    );
    const totalEntries = allSessions.length;
    const totalDuration = Object.values(
      dailyTotals("cardioDuration", data),
    ).reduce((sum, value) => sum + value, 0);
    const totalDistance = Object.values(
      dailyTotals("cardioDistance", data),
    ).reduce((sum, value) => sum + value, 0);

    const typeStats = allSessions.reduce(
      (acc, session) => {
        acc[session.type] = (acc[session.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const favoriteType =
      Object.entries(typeStats).sort(([, a], [, b]) => b - a)[0]?.[0] || "None";

    return {
      totalEntries,
      totalDuration,
      totalDistance,
      favoriteType,
      typeStats,
    };
  };

  // Get all-time goal percentage for goal modal
  const getAllTimeAverage = () => {
    const durations = dailyTotals("cardioDuration", data),
      distances = dailyTotals("cardioDistance", data);
    const legacyFormat = Array.from(
      new Set([...Object.keys(durations), ...Object.keys(distances)]),
    ).map((date) => ({
      date,
      duration: durations[date] ?? 0,
      distance: distances[date] ?? 0,
    }));
    return getAllTimeCardioAverage(legacyFormat);
  };

  const getAllTimeGoalPercentage = (): number => {
    const dailyLogsCount = Object.keys(data.dailyLogs).length;
    if (dailyLogsCount === 0) return 0;

    const { averageDuration, averageDistance } = getAllTimeAverage();
    const averageValue =
      data.goal.type === "duration" ? averageDuration : averageDistance;

    return percentage(
      averageValue,
      amount(data.goal.target) / (data.goal.period === "week" ? 7 : 1),
    );
  };

  const durationView = dailyTotals("cardioDuration", data),
    distanceView = dailyTotals("cardioDistance", data);
  const viewData = {
    ...data,
    currentDayDuration: durationView[getTodayString()] ?? 0,
    currentDayDistance: distanceView[getTodayString()] ?? 0,
    dailyLogs: Object.fromEntries(
      Object.entries(data.dailyLogs).map(([date, day]) => [
        date,
        {
          ...day,
          date,
          totalDuration: durationView[localDay(date) ?? date] ?? 0,
          totalDistance: distanceView[localDay(date) ?? date] ?? 0,
        },
      ]),
    ),
  };
  return {
    data: viewData,
    hasUserGoal: data.goalUserSet, // Flag indicating if user has explicitly set a goal
    addCardioEntry,
    updateCardioSession,
    deleteCardioSession,
    updateGoal,
    addCustomType,
    getAllCardioTypes,
    getTodaysCardio,
    getTodaysProgress,
    getWeeklyProgress,
    getLast10LogsAverage,
    getCardioStats,
    getAllTimeGoalPercentage,
    getHistoricalStats: () =>
      historicalStats(
        dailyTotals(
          data.goal.type === "duration" ? "cardioDuration" : "cardioDistance",
          data,
        ),
        now,
      ),
    getAllTimeAverage,
  };
}
