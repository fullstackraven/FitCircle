import { fastingRecord } from "@/lib/wellness-records";
import { STORAGE_KEYS } from "@/lib/storage-utils";
import {
  usePreservedWellness,
  useWellnessClock,
} from "./use-preserved-wellness";
import {
  amount,
  fastingProgress,
  completedFasts,
  percentage,
} from "@/lib/wellness-progress";
import { readWellnessGoals } from "@/lib/wellness-storage";
export interface FastingLog {
  id: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  duration: number; // in minutes
  loggedAt: string;
}

export function useFasting() {
  const now = useWellnessClock();
  const {
    data: logs,
    change,
    error,
  } = usePreservedWellness<FastingLog[]>(
    STORAGE_KEYS.FASTING,
    [],
    fastingRecord,
  );
  const goal = readWellnessGoals().fastingHours;
  const stats = fastingProgress(logs, goal, now);
  const getLast10LogsProgress = () => ({
    totalHours: Math.round(stats.totalHours * 10) / 10,
    averageHours: Math.round(stats.calendarDayAverage * 10) / 10,
    targetGoal: goal * 10,
    goalProgress: percentage(stats.totalHours, goal * 10),
    remaining: Math.max(0, goal * 10 - stats.totalHours),
    logsCount: new Set(
      completedFasts(logs, now)
        .filter((f) => {
          const d = new Date(f.date + "T12:00:00");
          const end = new Date(now);
          end.setDate(end.getDate() - 9);
          end.setHours(0, 0, 0, 0);
          return d >= end;
        })
        .map((f) => f.date),
    ).size,
    consistency: stats.consistency,
    achievedDays: stats.achievedDays,
  });
  return {
    logs,
    error,
    stats,
    hasUserGoal: Boolean(localStorage.getItem(STORAGE_KEYS.GOAL_FASTING)),
    addLog: (log: Omit<FastingLog, "id" | "loggedAt">) =>
      amount(log.duration) > 0 &&
      change((prev) => [
        ...prev,
        {
          ...log,
          id: Date.now().toString(),
          loggedAt: new Date().toISOString(),
        },
      ]),
    updateLog: (id: string, updates: Partial<FastingLog>) =>
      "duration" in updates && !amount(updates.duration)
        ? false
        : change((prev) =>
            prev.map((log) => (log.id === id ? { ...log, ...updates } : log)),
          ),
    deleteLog: (id: string) =>
      change((prev) => prev.filter((log) => log.id !== id)),
    getLast10LogsProgress,
    getAllTimeGoalPercentage: () => percentage(stats.completedAverage, goal),
  };
}
