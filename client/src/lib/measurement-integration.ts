import { applyRestore, prepareRestore } from "./backup";
import { getTodayString } from "./date-utils";
export const INTEGRATION_CHANGED = "fitcircleIntegrationChanged";
export const measurementKeys = [
  "weight",
  "height",
  "bodyFat",
  "neck",
  "chest",
  "waist",
  "hips",
  "bicepLeft",
  "bicepRight",
  "forearmLeft",
  "forearmRight",
  "thighLeft",
  "thighRight",
  "calfLeft",
  "calfRight",
] as const;
export type MeasurementKind = (typeof measurementKeys)[number];
export type Point = {
  date: string | null;
  value: number;
  source: "recorded" | "legacy";
};
export const plain = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export function readObject(
  raw: string | null,
  name: string,
): Record<string, unknown> {
  if (raw === null) return {};
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw Error(
      `${name} could not be read safely. Restore a verified backup in Settings.`,
    );
  }
  if (!plain(data))
    throw Error(
      `${name} could not be read safely. Restore a verified backup in Settings.`,
    );
  return data;
}
const positive = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v > 0;
const validDate = (v: unknown, today: string): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  v <= today &&
  Number.isFinite(new Date(v + "T12:00:00Z").getTime()) &&
  new Date(v + "T12:00:00Z").toISOString().slice(0, 10) === v;
export function readMeasurementRecord(storage: Storage = localStorage) {
  const raw = storage.getItem("fitcircle_measurements_history");
  const record = readObject(raw, "Measurement history");
  for (const value of Object.values(record))
    if (!Array.isArray(value))
      throw Error("Invalid measurement history. Original data is unchanged.");
  return { raw, record };
}
export function recordedPoints(
  record: Record<string, unknown>,
  key: string,
  today = getTodayString(),
): Point[] {
  return (Array.isArray(record[key]) ? record[key] : [])
    .filter(
      (v: unknown) =>
        plain(v) &&
        validDate(v.date, today) &&
        positive(v.value) &&
        (key !== "bodyFat" || v.value <= 100),
    )
    .map((v: any) => ({
      date: v.date,
      value: v.value,
      source: "recorded" as const,
    }))
    .sort((a, b) => a.date!.localeCompare(b.date!));
}
export function readMeasurementSnapshot(
  storage: Storage = localStorage,
  today = getTodayString(),
) {
  const { raw, record } = readMeasurementRecord(storage);
  const legacy =
    raw === null
      ? readObject(
          storage.getItem("fitcircle_measurements"),
          "Legacy measurements",
        )
      : {};
  const scalarWeight =
      raw === null ? storage.getItem("fitcircle_weight") : null,
    scalarHeight = raw === null ? storage.getItem("fitcircle_height") : null,
    scalarFat = raw === null ? storage.getItem("fitcircle_body_fat") : null;
  const choose = (key: string, scalar: string | null, old: unknown) => {
    const list = recordedPoints(record, key, today);
    if (list.length) {
      const last = list.at(-1)!;
      if (
        list.some(
          (point) => point.date === last.date && point.value !== last.value,
        )
      )
        throw Error(`Conflicting ${key} measurements share the latest date.`);
      return last;
    }
    if (raw !== null) return null;
    const value =
      old ?? (scalar === null || scalar.trim() === "" ? null : Number(scalar));
    return positive(value)
      ? { date: null, value, source: "legacy" as const }
      : null;
  };
  return {
    weight: choose("weight", scalarWeight, legacy.currentWeight),
    height: choose("height", scalarHeight, legacy.currentHeight),
    bodyFat: choose("bodyFat", scalarFat, legacy.currentBodyFat),
    startWeight: (() => {
      const list = recordedPoints(record, "weight", today),
        first = list[0];
      return first &&
        !list.some(
          (point) => point.date === first.date && point.value !== first.value,
        )
        ? first
        : null;
    })(),
  };
}
export type Direction = "lose" | "gain" | "maintain";
export function inferDirection(
  current: number | null,
  target: number | null,
): Direction | null {
  return current === null || target === null
    ? null
    : Math.abs(current - target) <= 0.5
      ? "maintain"
      : target < current
        ? "lose"
        : "gain";
}
export function readWeightGoals(
  storage: Storage = localStorage,
  current: number | null = null,
) {
  const unified = readObject(storage.getItem("fitcircle_goals"), "Goals");
  const legacy = readObject(
    storage.getItem("fitcircle_measurements"),
    "Legacy measurements",
  );
  const rawWeight = storage.getItem("fitcircle_goal_weight"),
    rawFat = storage.getItem("fitcircle_goal_bodyfat"),
    rawIntent = storage.getItem("fitcircle_weight_goal_type");
  const numeric = (v: unknown) =>
    v === null || v === undefined
      ? null
      : typeof v === "string" && v.trim() !== "" && positive(Number(v))
        ? Number(v)
        : positive(v)
          ? v
          : null;
  for (const key of ["targetWeight", "targetBodyFat", "weightLbs"])
    if (unified[key] !== undefined && numeric(unified[key]) === null)
      throw Error(
        "Saved measurement goals are invalid. Restore a verified backup before editing.",
      );
  const targetWeight =
    numeric(unified.targetWeight) ??
    numeric(rawWeight) ??
    numeric(legacy.targetWeight) ??
    numeric(unified.weightLbs);
  const targetBodyFat =
    numeric(unified.targetBodyFat) ??
    numeric(rawFat) ??
    numeric(legacy.targetBodyFat);
  const direction = (v: unknown): Direction | null =>
    ["gain", "lose", "maintain"].includes(String(v)) ? (v as Direction) : null;
  const intent =
    direction(unified.weightGoalType) ??
    direction(rawIntent) ??
    direction(legacy.weightGoalType);
  const inferred = inferDirection(current, targetWeight);
  const conflicts: string[] = [];
  if (rawWeight !== null && numeric(rawWeight) === null)
    conflicts.push("Invalid legacy weight goal retained.");
  if (rawFat !== null && numeric(rawFat) === null)
    conflicts.push("Invalid legacy body-fat goal retained.");
  if (rawIntent !== null && !direction(rawIntent))
    conflicts.push("Unrecognized legacy weight direction retained.");
  const weights = [unified.targetWeight, rawWeight, legacy.targetWeight]
    .map(numeric)
    .filter((v) => v !== null);
  if (new Set(weights).size > 1)
    conflicts.push(
      "Saved weight goals disagree; the unified goal takes precedence.",
    );
  if (intent && inferred && intent !== inferred)
    conflicts.push("Saved weight direction differs from the target weight.");
  if (direction(rawIntent) && intent !== direction(rawIntent))
    conflicts.push(
      "Saved weight directions disagree; the unified direction takes precedence.",
    );
  return { targetWeight, targetBodyFat, intent, inferred, conflicts };
}
export function weightGoalProgress(
  start: number | null,
  current: number | null,
  target: number | null,
  intent?: Direction,
): number | null {
  if (current === null || target === null) return null;
  if (intent === "maintain") return Math.abs(current - target) <= 0.5 ? 100 : 0;
  if (start === null) return null;
  if (intent === "lose" && target > start) return null;
  if (intent === "gain" && target < start) return null;
  if (start === target) return Math.abs(current - target) <= 0.5 ? 100 : 0;
  return Math.max(
    0,
    Math.min(100, ((current - start) / (target - start)) * 100),
  );
}
export function notifyIntegration() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(INTEGRATION_CHANGED));
}
export function saveMeasurements(
  patch: Partial<Record<MeasurementKind, number>>,
  date = getTodayString(),
  storage: Storage = localStorage,
  expectedRaw?: string | null,
) {
  if (!Object.keys(patch).length)
    throw Error("Enter at least one measurement.");
  const { raw, record } = readMeasurementRecord(storage);
  if (expectedRaw !== undefined && raw !== expectedRaw)
    throw Error("Measurements changed in another tab. Reload before saving.");
  if (raw !== null) prepareRestore({ fitcircle_measurements_history: raw });
  if (!validDate(date, getTodayString()))
    throw Error("Choose a valid recorded date.");
  const next = { ...record };
  for (const [key, value] of Object.entries(patch)) {
    if (
      !measurementKeys.includes(key as MeasurementKind) ||
      !positive(value) ||
      (key === "bodyFat" && value > 100)
    )
      throw Error("Enter valid positive measurements.");
    next[key] = [
      ...(Array.isArray(record[key]) ? record[key] : []).filter(
        (entry: any) => entry.date !== date,
      ),
      { date, value },
    ].sort((a: any, b: any) => a.date.localeCompare(b.date));
  }
  const mirrors: Record<MeasurementKind, string> = {
    weight: "fitcircle_weight",
    height: "fitcircle_height",
    bodyFat: "fitcircle_body_fat",
    neck: "fitcircle_neck",
    chest: "fitcircle_chest",
    waist: "fitcircle_waist",
    hips: "fitcircle_hips",
    bicepLeft: "fitcircle_bicep_left",
    bicepRight: "fitcircle_bicep_right",
    forearmLeft: "fitcircle_forearm_left",
    forearmRight: "fitcircle_forearm_right",
    thighLeft: "fitcircle_thigh_left",
    thighRight: "fitcircle_thigh_right",
    calfLeft: "fitcircle_calf_left",
    calfRight: "fitcircle_calf_right",
  };
  const entries: Record<string, string> = {
    fitcircle_measurements_history: JSON.stringify(next),
  };
  for (const key of Object.keys(patch) as MeasurementKind[]) {
    const latest = recordedPoints(next, key).at(-1);
    if (latest) entries[mirrors[key]] = String(latest.value);
  }
  applyRestore(prepareRestore(entries), storage, storage);
  notifyIntegration();
  return next;
}
export function saveMeasurementGoals(
  patch: { targetWeight?: number; targetBodyFat?: number; intent?: Direction },
  storage: Storage = localStorage,
) {
  const goals = readObject(storage.getItem("fitcircle_goals"), "Goals");
  const legacyRaw = storage.getItem("fitcircle_measurements");
  const legacy = readObject(legacyRaw, "Legacy measurements");
  if (
    (patch.targetWeight !== undefined && !positive(patch.targetWeight)) ||
    (patch.targetBodyFat !== undefined &&
      (!positive(patch.targetBodyFat) || patch.targetBodyFat > 100))
  )
    throw Error("Enter valid measurement goals.");
  const next = {
    ...goals,
    ...(patch.targetWeight !== undefined
      ? { targetWeight: patch.targetWeight }
      : {}),
    ...(patch.targetBodyFat !== undefined
      ? { targetBodyFat: patch.targetBodyFat }
      : {}),
    ...(patch.intent ? { weightGoalType: patch.intent } : {}),
  };
  const entries: Record<string, string> = {
    fitcircle_goals: JSON.stringify(next),
  };
  if (patch.targetWeight !== undefined)
    entries.fitcircle_goal_weight = String(patch.targetWeight);
  if (patch.targetBodyFat !== undefined)
    entries.fitcircle_goal_bodyfat = String(patch.targetBodyFat);
  if (patch.intent) entries.fitcircle_weight_goal_type = patch.intent;
  if (legacyRaw !== null)
    entries.fitcircle_measurements = JSON.stringify({
      ...legacy,
      ...(patch.targetWeight !== undefined
        ? { targetWeight: patch.targetWeight }
        : {}),
      ...(patch.targetBodyFat !== undefined
        ? { targetBodyFat: patch.targetBodyFat }
        : {}),
      ...(patch.intent ? { weightGoalType: patch.intent } : {}),
    });
  applyRestore(prepareRestore(entries), storage, storage);
  notifyIntegration();
}
