import {
  getTodayString,
  getCurrentTime,
  getAllTimeHydrationAverage,
} from "@/lib/date-utils";
import { STORAGE_KEYS } from "@/lib/storage-utils";
import {
  usePreservedWellness,
  useWellnessClock,
} from "./use-preserved-wellness";
import {
  hydrationRecord,
  editHydration,
  entryId,
} from "@/lib/wellness-records";
import {
  amount,
  historicalStats,
  localDay,
  dailyTotals,
  percentage,
  windowStats,
} from "@/lib/wellness-progress";
import { readWellnessGoals } from "@/lib/wellness-storage";
import { updateGoal } from "@/lib/goals-utils";
export interface HydrationEntry {
  id: string;
  time: string;
  amount: number;
  liquidType: string;
}

export interface HydrationLog {
  date: string;
  totalOz: number;
  entries: HydrationEntry[];
}

export interface HydrationData {
  dailyGoalOz: number;
  currentDayOz: number;
  logs: { [date: string]: HydrationLog };
  lastDate: string;
}

export function useHydration() {
  const now = useWellnessClock();
  const { data, change, error } = usePreservedWellness<HydrationData>(
    STORAGE_KEYS.HYDRATION,
    { dailyGoalOz: 64, currentDayOz: 0, logs: {}, lastDate: getTodayString() },
    hydrationRecord,
  );
  const today = getTodayString(),
    dailyGoalOz = readWellnessGoals().hydrationOz;
  const totals = dailyTotals("hydration", data),
    currentDayOz = totals[today] ?? 0;
  const viewLog = (date: string, log: HydrationLog) => ({
    ...log,
    date,
    totalOz: totals[localDay(date) ?? date] ?? 0,
    entries: (log.entries ?? []).map((entry, i) => ({
      ...entry,
      id: entryId(date, entry, i),
      liquidType: entry.liquidType ?? "Water",
    })),
  });
  const allLogs = () =>
    Object.entries(data.logs)
      .map(([date, log]) => viewLog(date, log))
      .sort((a, b) => b.date.localeCompare(a.date));
  const addHydration = (amountOz: number, liquidType = "Water") => {
    if (!amount(amountOz)) return false;
    return change((prev) => {
      const day = prev.logs[today] ?? { date: today, totalOz: 0, entries: [] };
      if (!Array.isArray(day.entries))
        throw new Error(
          "Saved hydration entries are incomplete. Restore a verified backup before changing this day.",
        );
      const entries = [
        ...(day.entries ?? []),
        {
          id: Date.now().toString(),
          time: getCurrentTime(),
          amount: amountOz,
          liquidType,
        },
      ];
      const logs = {
        ...prev.logs,
        [today]: {
          ...day,
          entries,
          totalOz: entries.reduce((sum, e) => sum + amount(e.amount), 0),
        },
      };
      const next = { ...prev, logs, lastDate: today };
      return {
        ...next,
        currentDayOz: dailyTotals("hydration", next)[today] ?? 0,
      };
    });
  };
  const getLast10LogsProgress = () => {
    const stats = windowStats(totals, now),
      targetGoal = dailyGoalOz * 10;
    return {
      totalOz: stats.total,
      averageOz: Math.round(stats.average * 10) / 10,
      targetGoal,
      goalProgress: percentage(stats.total, targetGoal),
      remaining: Math.max(0, targetGoal - stats.total),
      logsCount: stats.loggedDays,
    };
  };
  return {
    error,
    dailyGoalOz,
    currentDayOz,
    progressPercentage: percentage(currentDayOz, dailyGoalOz),
    hasUserGoal: Boolean(localStorage.getItem(STORAGE_KEYS.GOAL_HYDRATION)),
    addHydration,
    editHydrationEntry: (id: string, value: number, liquidType = "Water") =>
      amount(value) > 0 &&
      change((prev) =>
        editHydration(prev, id, { amount: value, liquidType }, today),
      ),
    deleteHydrationEntry: (id: string) =>
      change((prev) => editHydration(prev, id, null, today)),
    setDailyGoal: (value: number) => updateGoal("hydrationOz", value),
    getRecentLogs: (days = 7) => allLogs().slice(0, days),
    getAllLogs: allLogs,
    getTodayEntries: () =>
      data.logs[today] ? viewLog(today, data.logs[today]).entries : [],
    isGoalReached: dailyGoalOz > 0 && currentDayOz >= dailyGoalOz,
    getLast10LogsProgress,
    getHistoricalStats: () => historicalStats(totals, now),
    getAllTimeGoalPercentage: () =>
      percentage(getAllTimeHydrationAverage(data.logs).averageOz, dailyGoalOz),
  };
}
