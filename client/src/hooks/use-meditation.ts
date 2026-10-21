import { STORAGE_KEYS } from "@/lib/storage-utils";
import {
  getTodayString,
  getCurrentTime,
  getAllTimeMeditationAverage,
} from "@/lib/date-utils";
import {
  usePreservedWellness,
  useWellnessClock,
} from "./use-preserved-wellness";
import {
  meditationRecord,
  meditationDays,
  changeMeditation,
  entryId,
} from "@/lib/wellness-records";
import {
  historicalStats,
  localDay,
  dailyTotals,
  amount,
  percentage,
  windowStats,
} from "@/lib/wellness-progress";
import { readWellnessGoals } from "@/lib/wellness-storage";
export interface MeditationSession {
  id: string;
  time: string;
  duration: number; // in minutes
  completedAt: string;
}

export interface MeditationDailyLog {
  date: string;
  totalMinutes: number;
  sessions: MeditationSession[];
}

// Legacy interface for migration
export interface MeditationLog {
  id: string;
  date: string;
  time: string;
  duration: number; // in minutes
  completedAt: string;
}

export function useMeditation() {
  const now = useWellnessClock();
  const { data, change, error } = usePreservedWellness<any>(
    STORAGE_KEYS.MEDITATION,
    { dailyLogs: {}, lastDate: getTodayString(), currentDayMinutes: 0 },
    meditationRecord,
  );
  const today = getTodayString(),
    totals = dailyTotals("meditation", data);
  const dailyLogs = Object.fromEntries(
    Object.entries(meditationDays(data)).map(([date, day]) => [
      date,
      {
        ...day,
        date,
        totalMinutes: totals[localDay(date) ?? date] ?? 0,
      },
    ]),
  ) as Record<string, MeditationDailyLog>;
  const goal = readWellnessGoals().meditationMinutes;
  const getTodayMinutes = () => totals[today] ?? 0;
  const getAllSessions = (): (MeditationSession & { date: string })[] =>
    Object.entries(dailyLogs).flatMap(([date, day]: [string, any]) =>
      (day.sessions ?? []).map((session: any, i: number) => ({
        ...session,
        id: entryId(date, session, i),
        date,
      })),
    );
  const addSession = (duration: number) =>
    amount(duration) > 0 &&
    change((prev) =>
      changeMeditation(
        prev,
        today,
        null,
        {
          id: Date.now().toString(),
          time: getCurrentTime(),
          duration,
          completedAt: new Date().toISOString(),
        },
        today,
      ),
    );
  const getLast10LogsProgress = () => {
    const stats = windowStats(totals, now),
      targetGoal = goal * 10;
    return {
      totalMinutes: stats.total,
      averageMinutes: Math.round(stats.average * 10) / 10,
      targetGoal,
      goalProgress: percentage(stats.total, targetGoal),
      remaining: Math.max(0, targetGoal - stats.total),
      logsCount: stats.loggedDays,
    };
  };
  return {
    error,
    logs: getAllSessions(),
    dailyLogs,
    hasUserGoal: Boolean(localStorage.getItem(STORAGE_KEYS.GOAL_MEDITATION)),
    addLog: addSession,
    addSession,
    updateSession: (
      date: string,
      id: string,
      updates: Partial<MeditationSession>,
    ) =>
      "duration" in updates && !amount(updates.duration)
        ? false
        : change((prev) => changeMeditation(prev, date, id, updates, today)),
    deleteSession: (date: string, id: string) =>
      change((prev) => changeMeditation(prev, date, id, null, today)),
    getTodayMinutes,
    getDailyGoal: () => goal,
    getProgressPercentage: () => percentage(getTodayMinutes(), goal),
    isGoalReached: () => goal > 0 && getTodayMinutes() >= goal,
    getLast10LogsProgress,
    getHistoricalStats: () => historicalStats(totals, now),
    getAllTimeGoalPercentage: () =>
      percentage(
        getAllTimeMeditationAverage(getAllSessions()).averageMinutes,
        goal,
      ),
  };
}
