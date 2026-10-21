import {
  hydrationRecord,
  meditationRecord,
  fastingRecord,
} from "./wellness-records";
import { STORAGE_KEYS } from "./storage-utils";
import { loadStoredCardio } from "./cardio-initialization";
import {
  dailyTotals,
  wellnessGoal,
  cardioProgress,
  fastingProgress,
  percentage,
} from "./wellness-progress";
import { getDateString } from "./date-utils";
const parse = (raw: string | null, fallback: any) => {
  try {
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};
export function readWellnessGoals(
  storage: Pick<Storage, "getItem"> = localStorage,
) {
  const rawGoals = storage.getItem(STORAGE_KEYS.GOALS);
  const unified = parse(rawGoals, null);
  if (
    rawGoals !== null &&
    (!unified || typeof unified !== "object" || Array.isArray(unified))
  )
    return { hydrationOz: 0, meditationMinutes: 0, fastingHours: 0 };
  const hydration = parse(storage.getItem(STORAGE_KEYS.HYDRATION), {});
  return {
    hydrationOz: wellnessGoal(
      "hydrationOz",
      unified,
      storage.getItem(STORAGE_KEYS.GOAL_HYDRATION),
      hydration?.dailyGoalOz,
    ),
    meditationMinutes: wellnessGoal(
      "meditationMinutes",
      unified,
      storage.getItem(STORAGE_KEYS.GOAL_MEDITATION),
    ),
    fastingHours: wellnessGoal(
      "fastingHours",
      unified,
      storage.getItem(STORAGE_KEYS.GOAL_FASTING),
    ),
  };
}
export function currentWellness(
  storage: Storage = localStorage,
  now = new Date(),
) {
  const goals = readWellnessGoals(storage),
    today = getDateString(now);
  const rawHydration = parse(storage.getItem(STORAGE_KEYS.HYDRATION), {});
  const rawMeditation = parse(storage.getItem(STORAGE_KEYS.MEDITATION), []);
  const rawFasting = parse(storage.getItem(STORAGE_KEYS.FASTING), []);
  const hydration = hydrationRecord(rawHydration) ? rawHydration : {};
  const meditation = meditationRecord(rawMeditation) ? rawMeditation : [];
  const fasting = fastingRecord(rawFasting) ? rawFasting : [];
  let cardio: any = {
    dailyLogs: {},
    goal: { target: 21, type: "duration", period: "day" },
  };
  try {
    cardio = loadStoredCardio(storage, today).data;
  } catch {
    /* Unreadable records remain untouched. */
  }
  const hydrationCurrent = dailyTotals("hydration", hydration)[today] ?? 0;
  const meditationCurrent = dailyTotals("meditation", meditation)[today] ?? 0;
  return {
    goals,
    hydration: {
      current: hydrationCurrent,
      target: goals.hydrationOz,
      percentage: percentage(hydrationCurrent, goals.hydrationOz),
      unit: "oz",
    },
    meditation: {
      current: meditationCurrent,
      target: goals.meditationMinutes,
      percentage: percentage(meditationCurrent, goals.meditationMinutes),
      unit: "min",
    },
    fasting: fastingProgress(fasting, goals.fastingHours, now),
    cardio: cardioProgress(cardio, now),
    cardioData: cardio,
  };
}
