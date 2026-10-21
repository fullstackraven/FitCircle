import { amount, dailyTotals, localDay } from "./wellness-progress";
export const objectRecord = (value: any) =>
  !!value && typeof value === "object" && !Array.isArray(value);
const numericField = (value: any) =>
  typeof value === "number" || typeof value === "string";
const optionalText = (value: any) =>
  value === undefined || typeof value === "string";
const validSession = (session: any) =>
  objectRecord(session) &&
  numericField(session.duration) &&
  ["id", "time", "date", "completedAt"].every((key) =>
    optionalText(session[key]),
  );
const validHydrationEntry = (entry: any) =>
  objectRecord(entry) &&
  numericField(entry.amount) &&
  ["id", "time", "liquidType"].every((key) => optionalText(entry[key]));
export const hydrationRecord = (value: any) =>
  objectRecord(value) &&
  objectRecord(value.logs) &&
  Object.values(value.logs).every(
    (day: any) =>
      objectRecord(day) &&
      (!("entries" in day) ||
        (Array.isArray(day.entries) && day.entries.every(validHydrationEntry))),
  );
export const meditationRecord = (value: any) =>
  (Array.isArray(value) && value.every(validSession)) ||
  (objectRecord(value) &&
    (objectRecord(value.dailyLogs)
      ? Object.values(value.dailyLogs).every(
          (day: any) =>
            objectRecord(day) &&
            (!("sessions" in day) ||
              (Array.isArray(day.sessions) &&
                day.sessions.every(validSession))),
        )
      : Array.isArray(value.logs) && value.logs.every(validSession)));
export const fastingRecord = (value: any) =>
  Array.isArray(value) &&
  value.every(
    (log: any) =>
      objectRecord(log) &&
      numericField(log.duration) &&
      ["id", "startDate", "startTime", "endDate", "endTime"].every(
        (key) => typeof log[key] === "string",
      ),
  );
export const entryId = (date: string, entry: any, index: number) =>
  entry?.id ?? `${date}-${index}-${entry?.time ?? ""}`;
export function editHydration(
  data: any,
  id: string,
  patch: any | null,
  today: string,
) {
  const logs = { ...data.logs };
  for (const [date, log] of Object.entries(data.logs) as [string, any][]) {
    if (!Array.isArray(log.entries)) continue;
    const index = log.entries.findIndex(
      (e: any, i: number) => entryId(date, e, i) === id,
    );
    if (index < 0) continue;
    const entries = log.entries.flatMap((e: any, i: number) =>
      i !== index ? [e] : patch === null ? [] : [{ ...e, ...patch }],
    );
    logs[date] = {
      ...log,
      entries,
      totalOz: entries.reduce(
        (sum: number, e: any) => sum + amount(e?.amount),
        0,
      ),
    };
  }
  const next = { ...data, logs };
  return {
    ...next,
    currentDayOz: dailyTotals("hydration", next)[today] ?? 0,
    lastDate: today,
  };
}
export function meditationDays(data: any): Record<string, any> {
  if (objectRecord(data?.dailyLogs)) return data.dailyLogs;
  const days: Record<string, any> = {};
  const entries = Array.isArray(data) ? data : (data?.logs ?? []);
  entries.forEach((session: any, index: number) => {
    const date = localDay(session?.date ?? session?.completedAt);
    if (!date) return;
    days[date] ??= { date, totalMinutes: 0, sessions: [] };
    days[date].sessions.push({ ...session, id: entryId(date, session, index) });
    days[date].totalMinutes += amount(session?.duration);
  });
  return days;
}
export function changeMeditation(
  data: any,
  date: string,
  id: string | null,
  patch: any | null,
  today: string,
) {
  if (Array.isArray(data) || (!data.dailyLogs && Array.isArray(data.logs))) {
    const entries = Array.isArray(data) ? data : data.logs;
    const next =
      id === null
        ? [...entries, { ...patch, date }]
        : entries.flatMap((e: any, i: number) => {
            const day = localDay(e?.date ?? e?.completedAt);
            return day === localDay(date) && entryId(day!, e, i) === id
              ? patch === null
                ? []
                : [{ ...e, ...patch }]
              : [e];
          });
    return Array.isArray(data) ? next : { ...data, logs: next };
  }
  const day = data.dailyLogs[date] ?? { date, totalMinutes: 0, sessions: [] };
  if (!Array.isArray(day.sessions))
    throw new Error(
      "Saved meditation sessions are incomplete. Restore a verified backup before changing this day.",
    );
  const sessions =
    id === null
      ? [...day.sessions, patch]
      : day.sessions.flatMap((e: any, i: number) =>
          entryId(date, e, i) !== id
            ? [e]
            : patch === null
              ? []
              : [{ ...e, ...patch }],
        );
  const dailyLogs = {
    ...data.dailyLogs,
    [date]: {
      ...day,
      sessions,
      totalMinutes: sessions.reduce(
        (sum: number, e: any) => sum + amount(e?.duration),
        0,
      ),
    },
  };
  const next = { ...data, dailyLogs };
  return {
    ...next,
    currentDayMinutes: dailyTotals("meditation", next)[today] ?? 0,
    lastDate: today,
  };
}
