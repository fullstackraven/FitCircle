import { getDateString, parseLocalDate } from "./date-utils";

export const amount = (value: unknown): number => {
  if (typeof value !== "number" && typeof value !== "string") return 0;
  if (typeof value === "string" && !value.trim()) return 0;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 && n <= Number.MAX_SAFE_INTEGER ? n : 0;
};
export const percentage = (current: unknown, target: unknown) =>
  amount(target)
    ? Math.min(100, Math.min(1, amount(current) / amount(target)) * 100)
    : 0;
export function localDay(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(value) ||
    /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)
  ) {
    const date = parseLocalDate(value);
    const canonical = value.includes("/")
      ? (() => {
          const [m, d, y] = value.split("/");
          return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        })()
      : value;
    return getDateString(date) === canonical ? canonical : null;
  }
  // Only timestamp strings with an explicit time are interpreted as instants.
  if (!value.includes("T")) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? getDateString(date) : null;
}
export function calendarDates(now = new Date(), days = 10): string[] {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - i);
    return getDateString(date);
  });
}
export function weekDates(now = new Date()): string[] {
  return calendarDates(now, now.getDay() + 1); // Sunday start, through today; future records excluded.
}
type Kind = "hydration" | "meditation" | "cardioDuration" | "cardioDistance";
export function dailyTotals(kind: Kind, input: any): Record<string, number> {
  const totals: Record<string, number> = {};
  const add = (date: unknown, value: unknown) => {
    const key = localDay(date);
    if (
      !key ||
      (typeof value !== "number" && typeof value !== "string") ||
      (typeof value === "string" && !value.trim()) ||
      !Number.isFinite(Number(value)) ||
      Number(value) < 0 ||
      Number(value) > Number.MAX_SAFE_INTEGER
    )
      return;
    totals[key] = (totals[key] ?? 0) + Number(value);
  };
  if (kind === "hydration") {
    for (const [date, log] of Object.entries(input?.logs ?? {}) as [
      string,
      any,
    ][]) {
      if (Array.isArray(log?.entries))
        for (const e of log.entries) add(date, e?.amount);
      else add(date, log?.totalOz);
    }
  } else if (kind === "meditation") {
    if (input?.dailyLogs && typeof input.dailyLogs === "object") {
      for (const [date, log] of Object.entries(input.dailyLogs) as [
        string,
        any,
      ][]) {
        if (Array.isArray(log?.sessions))
          for (const s of log.sessions) add(date, s?.duration);
        else add(date, log?.totalMinutes);
      }
    } else {
      for (const s of Array.isArray(input)
        ? input
        : Array.isArray(input?.logs)
          ? input.logs
          : [])
        add(s?.date ?? s?.completedAt, s?.duration);
    }
  } else {
    const field = kind === "cardioDuration" ? "duration" : "distance";
    if (input?.dailyLogs && typeof input.dailyLogs === "object") {
      for (const [date, log] of Object.entries(input.dailyLogs) as [
        string,
        any,
      ][]) {
        if (Array.isArray(log?.sessions))
          for (const s of log.sessions) add(date, s?.[field]);
        else
          add(
            date,
            log?.[field === "duration" ? "totalDuration" : "totalDistance"],
          );
      }
    } else {
      for (const s of Array.isArray(input)
        ? input
        : Array.isArray(input?.entries)
          ? input.entries
          : [])
        add(
          s?.date ??
            (typeof s?.timestamp === "number"
              ? Number.isFinite(new Date(s.timestamp).getTime())
                ? new Date(s.timestamp).toISOString()
                : null
              : null),
          s?.[field],
        );
    }
  }
  // Overflow must never become NaN/Infinity in a display.
  for (const key of Object.keys(totals))
    if (!Number.isFinite(totals[key])) totals[key] = 0;
  return totals;
}
export function windowStats(
  totals: Record<string, number>,
  now = new Date(),
  days = 10,
) {
  const dates = calendarDates(now, days);
  const total = dates.reduce((sum, date) => sum + amount(totals[date]), 0);
  const loggedDays = dates.filter((date) => amount(totals[date]) > 0).length;
  return {
    total: Number.isFinite(total) ? total : 0,
    calendarDays: days,
    loggedDays,
    average: Number.isFinite(total) ? total / days : 0,
  };
}
export function historicalStats(
  totals: Record<string, number>,
  now = new Date(),
) {
  const today = getDateString(now);
  const dates = Object.keys(totals)
    .filter(
      (date) =>
        localDay(date) === date &&
        date <= today &&
        Number.isFinite(totals[date]) &&
        totals[date] >= 0,
    )
    .sort();
  if (!dates.length)
    return {
      total: 0,
      calendarDays: 0,
      loggedDays: 0,
      average: 0,
      loggedDayAverage: 0,
    };
  const ordinal = (date: string) => {
    const [y, m, d] = date.split("-").map(Number);
    return Date.UTC(y, m - 1, d) / 86400000;
  };
  const calendarDays = ordinal(today) - ordinal(dates[0]) + 1;
  const sum = dates.reduce((sum, date) => sum + amount(totals[date]), 0),
    total = Number.isFinite(sum) ? sum : 0;
  return {
    total,
    calendarDays,
    loggedDays: dates.length,
    average: total / calendarDays,
    loggedDayAverage: total / dates.length,
  };
}
export const wellnessDefaults = {
  hydrationOz: 64,
  meditationMinutes: 20,
  fastingHours: 16,
};
export function wellnessGoal(
  key: keyof typeof wellnessDefaults,
  unified: any,
  legacy: unknown,
  embedded?: unknown,
) {
  if (unified && Object.prototype.hasOwnProperty.call(unified, key))
    return amount(unified[key]);
  if (legacy !== null && legacy !== undefined) return amount(legacy);
  if (embedded !== null && embedded !== undefined) return amount(embedded);
  return wellnessDefaults[key];
}
export function cardioProgress(data: any, now = new Date()) {
  const goal = data?.goal ?? { type: "duration", target: 21, period: "day" };
  const duration = dailyTotals("cardioDuration", data),
    distance = dailyTotals("cardioDistance", data);
  const period = goal.period === "week" ? "week" : "day";
  const dates = period === "week" ? weekDates(now) : [getDateString(now)];
  const totalDuration = amount(
    dates.reduce((sum, date) => sum + amount(duration[date]), 0),
  );
  const totalDistance = amount(
    dates.reduce((sum, date) => sum + amount(distance[date]), 0),
  );
  const current = goal.type === "distance" ? totalDistance : totalDuration,
    target = amount(goal.target);
  return {
    period,
    current,
    target,
    percentage: percentage(current, target),
    remaining: Math.max(0, target - current),
    totalDuration,
    totalDistance,
  };
}
export function completedFasts(logs: any, now = new Date()) {
  return (Array.isArray(logs) ? logs : []).flatMap((log: any) => {
    const date = localDay(log?.endDate);
    if (!date || date > getDateString(now)) return [];
    const end = new Date(`${date}T${log.endTime ?? "23:59"}`).getTime();
    if (!Number.isFinite(end) || end > now.getTime()) return [];
    const startDate = localDay(log.startDate);
    const start = startDate
      ? new Date(`${startDate}T${log.startTime ?? "00:00"}`).getTime()
      : NaN;
    if (Number.isFinite(start) && end <= start) return [];
    const hours = Object.prototype.hasOwnProperty.call(log, "duration")
      ? amount(log.duration) / 60
      : Number.isFinite(start)
        ? amount((end - start) / 3600000)
        : 0;
    return hours ? [{ date, hours, log }] : [];
  });
}
export function fastingProgress(logs: any, target: unknown, now = new Date()) {
  const fasts = completedFasts(logs, now),
    today = getDateString(now),
    goal = amount(target);
  const todayHours = fasts
    .filter((f) => f.date === today)
    .reduce((longest, f) => Math.max(longest, f.hours), 0);
  const dates = calendarDates(now, 10);
  const recent = fasts.filter((f) => dates.includes(f.date));
  const achievedDays = new Set(
    recent.filter((f) => goal > 0 && f.hours >= goal).map((f) => f.date),
  ).size;
  const sum = recent.reduce((sum, f) => sum + f.hours, 0),
    totalHours = Number.isFinite(sum) ? sum : 0;
  return {
    activeHours: null,
    todayHours,
    percentage: percentage(todayHours, goal),
    consistency: (achievedDays / 10) * 100,
    achievedDays,
    totalHours,
    calendarDayAverage: totalHours / 10,
    completedAverage: fasts.reduce(
      (average, f, index) => average + (f.hours - average) / (index + 1),
      0,
    ),
  };
}
