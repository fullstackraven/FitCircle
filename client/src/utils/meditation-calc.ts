import { dailyTotals, windowStats, percentage } from "@/lib/wellness-progress";
import { readWellnessGoals } from "@/lib/wellness-storage";
import { getTodayString } from "@/lib/date-utils";
import { updateGoal } from "@/lib/goals-utils";
import { meditationDays } from "@/lib/wellness-records";
// Shared meditation calculation utilities
// This ensures Goals page and Meditation page use identical logic

export interface MeditationSession {
  duration: number;
  completedAt?: string;
  date?: string;
}

export const calculateMeditation7DayAverage = (
  logs: MeditationSession[],
): number =>
  windowStats(dailyTotals("meditation", logs), new Date(), 7).average;
export const calculateMeditationProgress = (
  logs: MeditationSession[],
  goalMinutes: number,
): number =>
  percentage(
    dailyTotals("meditation", logs)[getTodayString()] ?? 0,
    goalMinutes,
  );
export const getMeditationGoal = () => readWellnessGoals().meditationMinutes;
export const setMeditationGoal = (value: number) =>
  updateGoal("meditationMinutes", value);
export const getMeditationLogs = (): MeditationSession[] => {
  try {
    const raw = JSON.parse(
      localStorage.getItem("fitcircle_meditation_logs") ?? "[]",
    );
    return Object.entries(meditationDays(raw)).flatMap(([date, day]) =>
      (day.sessions ?? []).map((session: any) => ({ ...session, date })),
    );
  } catch {
    return [];
  }
};
