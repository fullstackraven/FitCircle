import { z } from "zod";
import { STORAGE_KEYS } from "./storage-utils";
import { getDateString } from "./date-utils";
import type {
  CardioData,
  CardioDailyLog,
  CardioGoal,
} from "@/hooks/use-cardio";

export class StoredCardioDataError extends Error {
  readonly #originals: Record<string, string>;
  constructor(
    originals: Record<string, string>,
    readonly reason: "invalid" | "unavailable",
  ) {
    super("Saved cardio data could not be loaded safely");
    this.name = "StoredCardioDataError";
    this.#originals = { ...originals };
  }
  // Never place personal records in error messages or enumerable error fields.
  get originals() {
    return { ...this.#originals };
  }
}
const number = z.number().finite();
const text = z.string();
const goal = z
  .object({
    type: z.enum(["distance", "duration"]),
    target: number,
    period: z.enum(["day", "week"]).optional(),
  })
  .passthrough();
const session = z
  .object({
    id: text,
    time: text,
    type: text,
    duration: number,
    distance: number.optional(),
    notes: text.optional(),
  })
  .passthrough();
const logs = z.record(
  z
    .object({
      date: text,
      totalDuration: number,
      totalDistance: number,
      sessions: z.array(session),
    })
    .passthrough(),
);
const legacyNumber = z.union([
  number,
  text.refine((s) => s.trim() !== "" && Number.isFinite(Number(s))),
]);
const entry = z
  .object({
    id: text.optional(),
    date: text.min(1).optional(),
    timestamp: number.optional(),
    type: text.optional(),
    name: text.optional(),
    activity: text.optional(),
    time: text.optional(),
    duration: legacyNumber,
    distance: legacyNumber.optional(),
    notes: text.optional(),
  })
  .passthrough()
  .refine(
    (e) =>
      Boolean(e.date) ||
      (e.timestamp !== undefined &&
        Number.isFinite(new Date(e.timestamp).getTime())),
  );
const entries = z.array(entry);
const document = z
  .object({
    dailyLogs: logs.optional(),
    entries: entries.optional(),
    goal: goal.optional(),
    goalUserSet: z.boolean().optional(),
    customTypes: z.array(text).optional(),
    lastDate: text.optional(),
    currentDayDuration: number.optional(),
    currentDayDistance: number.optional(),
  })
  .passthrough();
const legacyKeys = [
  "fitcircle_cardio",
  "cardioLogs",
  "cardio_entries",
  "cardio",
] as const;

export interface CardioInitialization {
  data: CardioData;
  originalGoal: CardioGoal | undefined;
  legacySource: boolean;
}

/** Read and validate before React can commit effects; initialization never writes. */
export function loadStoredCardio(
  storage: Pick<Storage, "getItem">,
  today: string,
): CardioInitialization {
  const originals: Record<string, string> = {};
  const invalid = (): never => {
    throw new StoredCardioDataError(originals, "invalid");
  };
  const read = (key: string) => {
    let raw: string | null;
    try {
      raw = storage.getItem(key);
    } catch {
      throw new StoredCardioDataError(originals, "unavailable");
    }
    if (raw !== null) originals[key] = raw;
    return raw;
  };
  const parse = (raw: string): unknown => {
    try {
      return JSON.parse(raw);
    } catch {
      return invalid();
    }
  };
  let source: z.infer<typeof document> | undefined;
  const primary = read(STORAGE_KEYS.CARDIO);
  if (primary !== null) {
    const parsed = document.safeParse(parse(primary));
    if (
      !parsed.success ||
      (parsed.data.dailyLogs === undefined &&
        parsed.data.entries === undefined) ||
      (parsed.data.dailyLogs !== undefined && parsed.data.goal === undefined)
    )
      invalid();
    // Use originals rather than schema output, preserving metadata and formats.
    source = JSON.parse(primary);
  } else {
    for (const key of legacyKeys) {
      const raw = read(key);
      if (raw === null) continue;
      const value = parse(raw);
      if (Array.isArray(value)) {
        if (!entries.safeParse(value).success) invalid();
        if (value.length === 0) continue; // Existing empty-alias precedence.
        source = { entries: value };
        break;
      }
      const parsed = document.safeParse(value);
      if (!parsed.success || parsed.data.entries === undefined) invalid();
      source = value as z.infer<typeof document>;
      break;
    }
  }
  let explicitGoal: z.infer<typeof goal> | undefined;
  if (source?.goalUserSet === undefined) {
    const raw = read("fitcircle_goal_cardio");
    if (raw !== null) {
      const parsed = goal.safeParse(parse(raw));
      if (!parsed.success) invalid();
      explicitGoal = JSON.parse(raw);
    }
  }
  const originalGoal = source?.goal ?? explicitGoal;
  const selectedGoal = originalGoal ?? {
    type: "duration" as const,
    target: 21,
    period: "day" as const,
  };
  const runtimeGoal = selectedGoal;
  let dailyLogs = source?.dailyLogs as CardioData["dailyLogs"] | undefined;
  if (dailyLogs === undefined) {
    dailyLogs = Object.create(null) as CardioData["dailyLogs"];
    for (const [index, e] of (source?.entries ?? []).entries()) {
      const date = e.date ?? getDateString(new Date(e.timestamp!));
      // A date-only legacy record has no authoritative time. Do not invent now.
      const time =
        e.time ??
        (e.timestamp !== undefined
          ? new Date(e.timestamp).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "");
      const log: CardioDailyLog = dailyLogs[date] ?? {
        date,
        totalDuration: 0,
        totalDistance: 0,
        sessions: [],
      };
      const duration = Number(e.duration),
        distance = e.distance === undefined ? undefined : Number(e.distance);
      log.sessions.push({
        ...e,
        id:
          e.id ||
          String(
            e.timestamp ??
              `${date}-${e.type || e.name || e.activity || "cardio"}-${index}`,
          ),
        time,
        type: e.type || e.name || e.activity || "cardio",
        duration,
        distance,
      });
      log.totalDuration += duration;
      log.totalDistance += distance ?? 0;
      dailyLogs[date] = log;
    }
  }
  const data = {
    ...source,
    dailyLogs,
    goal: runtimeGoal,
    goalUserSet:
      source?.goalUserSet ??
      Boolean(
        explicitGoal ||
        (originalGoal &&
          (originalGoal.target !== 21 || originalGoal.type !== "duration")),
      ),
    customTypes: source?.customTypes ?? [],
    lastDate: today,
    currentDayDuration: dailyLogs[today]?.totalDuration ?? 0,
    currentDayDistance: dailyLogs[today]?.totalDistance ?? 0,
  } as CardioData;
  return {
    data,
    originalGoal: originalGoal as CardioGoal | undefined,
    legacySource: primary === null && source !== undefined,
  };
}
