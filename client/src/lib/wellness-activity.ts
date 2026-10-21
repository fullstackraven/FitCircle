import { amount, calendarDates } from "./wellness-progress";

export type ActivityWindow = 7 | 30 | 90;
/** Read-only local calendar projection; missing days remain explicit zeroes. */
export function recentWellnessActivity(
  totals: Record<string, number>,
  days: ActivityWindow,
  now = new Date(),
) {
  const points = calendarDates(now, days)
    .reverse()
    .map((date) => ({ date, value: amount(totals[date]) }));
  const sum = points.reduce((total, point) => total + point.value, 0);
  const total = Number.isFinite(sum) ? sum : 0;
  return {
    points,
    total,
    average: total / days,
    activeDays: points.filter((point) => point.value > 0).length,
  };
}
export function fastingDailyHours(fasts: { date: string; hours: number }[]) {
  const totals: Record<string, number> = {};
  for (const fast of fasts)
    totals[fast.date] = (totals[fast.date] ?? 0) + amount(fast.hours);
  return totals;
}
export const formatWellnessValue = (n: number) =>
  Number.isFinite(n) ? Number(n.toFixed(1)).toLocaleString() : "0";
