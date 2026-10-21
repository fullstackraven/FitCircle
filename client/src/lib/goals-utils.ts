import { currentWellness, readWellnessGoals } from "./wellness-storage";
import { amount, percentage, dailyTotals } from "./wellness-progress";
import { applyRestore, prepareRestore } from "./backup";
import {
  readObject,
  readMeasurementSnapshot,
  readWeightGoals,
  weightGoalProgress,
  saveMeasurementGoals,
} from "./measurement-integration";
// Unified Goals Management System
// This eliminates redundant goal-handling code across all pages
import { STORAGE_KEYS, safeParseJSON } from "./storage-utils";
import {
  getTodayString,
  getAllTimeFastingAverage,
  getAllTimeHydrationAverage,
  getAllTimeMeditationAverage,
  getAllTimeCardioAverage,
} from "./date-utils";

export interface UnifiedGoals {
  hydrationOz: number;
  meditationMinutes: number;
  fastingHours: number;
  maxFastingHours: number;
  targetWeight: number;
  targetBodyFat: number;
  workoutConsistency: number;
  cardioWeeklyMiles?: number;
  cardioWeeklyMinutes?: number;
}

export interface GoalProgress {
  current: number;
  target: number;
  percentage: number;
  unit: string;
}

const DEFAULT_GOALS: UnifiedGoals = {
  hydrationOz: 64,
  meditationMinutes: 20,
  fastingHours: 16,
  maxFastingHours: 24,
  targetWeight: 150,
  targetBodyFat: 15,
  workoutConsistency: 100,
  cardioWeeklyMiles: 10,
  cardioWeeklyMinutes: 150,
};

function sanitizeGoals(goals: UnifiedGoals): UnifiedGoals {
  const result = { ...goals };
  for (const key of Object.keys(DEFAULT_GOALS) as (keyof UnifiedGoals)[])
    result[key] = amount(result[key]);
  return result;
}
/**
 * Master function to get all goals from unified storage
 * Reads legacy values without migrating or saving inferred defaults.
 */
function measurementTargets() {
  try {
    const goals = readWeightGoals();
    return {
      ...(goals.targetWeight !== null
        ? { targetWeight: goals.targetWeight }
        : {}),
      ...(goals.targetBodyFat !== null
        ? { targetBodyFat: goals.targetBodyFat }
        : {}),
    };
  } catch {
    return {};
  }
}
export function getAllGoals(): UnifiedGoals {
  // Try new unified storage first
  const unifiedGoals = safeParseJSON(
    localStorage.getItem(STORAGE_KEYS.GOALS),
    null,
  );
  if (
    unifiedGoals &&
    typeof unifiedGoals === "object" &&
    unifiedGoals !== null
  ) {
    return sanitizeGoals({
      ...DEFAULT_GOALS,
      ...(unifiedGoals as UnifiedGoals),
      ...readWellnessGoals(),
      ...measurementTargets(),
    });
  }

  // Migrate from old individual storage keys
  const migratedGoals: Partial<UnifiedGoals> = {};

  const hydration = localStorage.getItem("fitcircle_goal_hydration");
  if (hydration) migratedGoals.hydrationOz = parseFloat(hydration);

  const meditation = localStorage.getItem("fitcircle_goal_meditation");
  if (meditation) migratedGoals.meditationMinutes = parseFloat(meditation);

  const fasting = localStorage.getItem("fitcircle_goal_fasting");
  if (fasting) migratedGoals.fastingHours = parseFloat(fasting);

  const weight = localStorage.getItem("fitcircle_goal_weight");
  if (weight) migratedGoals.targetWeight = parseFloat(weight);

  const bodyFat = localStorage.getItem("fitcircle_goal_bodyfat");
  if (bodyFat) migratedGoals.targetBodyFat = parseFloat(bodyFat);

  // Check measurements for weight/body fat goals
  const measurements = safeParseJSON(
    localStorage.getItem("fitcircle_measurements"),
    {},
  );
  if (
    measurements &&
    typeof measurements === "object" &&
    measurements !== null
  ) {
    if ((measurements as any).targetWeight)
      migratedGoals.targetWeight = (measurements as any).targetWeight;
    if ((measurements as any).targetBodyFat)
      migratedGoals.targetBodyFat = (measurements as any).targetBodyFat;
  }

  const finalGoals = {
    ...DEFAULT_GOALS,
    ...migratedGoals,
    ...readWellnessGoals(),
    ...measurementTargets(),
  };

  // Read-only compatibility: never migrate inferred defaults while reading.

  return sanitizeGoals(finalGoals);
}

/**
 * Master function to update any goal and sync across all storage locations
 */
export function updateGoal(goalType: keyof UnifiedGoals, value: number): void {
  if (!amount(value)) throw new Error("Enter a finite positive goal.");
  if (goalType === "targetWeight" || goalType === "targetBodyFat") {
    saveMeasurementGoals({ [goalType]: value });
    return;
  }
  const existing = readObject(
    localStorage.getItem(STORAGE_KEYS.GOALS),
    "Goals",
  );
  const keys: Partial<Record<keyof UnifiedGoals, string>> = {
    hydrationOz: "fitcircle_goal_hydration",
    meditationMinutes: "fitcircle_goal_meditation",
    fastingHours: "fitcircle_goal_fasting",
  };
  const entries: Record<string, string> = {
    fitcircle_goals: JSON.stringify({ ...existing, [goalType]: value }),
  };
  const legacy = keys[goalType];
  if (legacy) entries[legacy] = String(value);
  applyRestore(prepareRestore(entries));
  window.dispatchEvent(new Event("fitcircleWellnessChanged"));
}

/**
 * Get hydration progress using master date utilities
 */
export function getHydrationProgress(): GoalProgress {
  return currentWellness().hydration;
}
export function getMeditationProgress(): GoalProgress {
  return currentWellness().meditation;
}
/** Completed today, never an inferred active fast or historical average. */
export function getFastingProgress(): GoalProgress {
  const value = currentWellness();
  return {
    current: value.fasting.todayHours,
    target: value.goals.fastingHours,
    percentage: value.fasting.percentage,
    unit: "hrs",
  };
}

/**
 * Get weight progress using master date utilities
 */
export function getWeightProgress(): GoalProgress {
  try {
    const measurements = readMeasurementSnapshot();
    const goals = readWeightGoals(
      localStorage,
      measurements.weight?.value ?? null,
    );
    return {
      current: measurements.weight?.value ?? 0,
      target: goals.targetWeight ?? 0,
      percentage:
        weightGoalProgress(
          measurements.startWeight?.value ?? null,
          measurements.weight?.value ?? null,
          goals.targetWeight,
        ) ?? 0,
      unit: "lbs",
    };
  } catch {
    return { current: 0, target: 0, percentage: 0, unit: "lbs" };
  }
}

/**
 * Get body fat progress using master date utilities
 */
export function getBodyFatProgress(): GoalProgress {
  const goals = getAllGoals();
  const measurements = safeParseJSON(
    localStorage.getItem("fitcircle_measurements"),
    {},
  ) as any;

  const current = amount(measurements?.currentBodyFat);
  const target = goals.targetBodyFat;

  let percentage = 0;
  if (current > 0 && target > 0) {
    const tolerance = target * 0.1; // 10% tolerance for body fat
    const difference = Math.abs(current - target);
    percentage = Math.max(0, 100 - (difference / tolerance) * 100);
  }

  return { current, target, percentage, unit: "%" };
}

/**
 * Get workout consistency progress using master date utilities
 */
export function getWorkoutConsistencyProgress(): GoalProgress {
  const goals = getAllGoals();
  const workouts = safeParseJSON(localStorage.getItem(STORAGE_KEYS.WORKOUTS), {
    workouts: [],
  });
  const recovery = safeParseJSON(localStorage.getItem(STORAGE_KEYS.RECOVERY), {
    recoveryDays: [],
  });

  let current = 0;
  if (workouts?.workouts && Array.isArray(workouts.workouts)) {
    const logs = safeParseJSON(
      localStorage.getItem(STORAGE_KEYS.WORKOUT_LOGS),
      {},
    );
    const today = getTodayString();

    // Calculate last 30 days consistency
    const last30Days: string[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      last30Days.push(`${year}-${month}-${day}`);
    }

    let workoutDays = 0;
    let recoveryDays = 0;

    last30Days.forEach((date) => {
      // Check if any workout was logged this day
      const hasWorkout = workouts.workouts.some((workout: any) => {
        const workoutLogs = (logs as any)[workout.id];
        return workoutLogs && workoutLogs[date] && workoutLogs[date] > 0;
      });

      // Check if it was a recovery day
      const recoveryDaysArray = (recovery?.recoveryDays || []) as string[];
      const isRecoveryDay = recoveryDaysArray.includes(date);

      if (hasWorkout || isRecoveryDay) {
        if (hasWorkout) workoutDays++;
        if (isRecoveryDay) recoveryDays++;
      }
    });

    current = Math.round(((workoutDays + recoveryDays) / 30) * 100);
  }

  const target = goals.workoutConsistency;
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return { current, target, percentage, unit: "%" };
}

/**
 * Get cardio progress using master date utilities (weekly goals)
 */
export function getCardioProgress(): {
  miles: GoalProgress;
  minutes: GoalProgress;
} {
  const value = currentWellness(),
    goal = value.cardioData.goal;
  const minutes = goal.type === "duration",
    target = value.cardio.target;
  return {
    miles: {
      current: value.cardio.totalDistance,
      target: minutes ? 0 : target,
      percentage: minutes ? 0 : value.cardio.percentage,
      unit: "mi",
    },
    minutes: {
      current: value.cardio.totalDuration,
      target: minutes ? target : 0,
      percentage: minutes ? value.cardio.percentage : 0,
      unit: "min",
    },
  };
}
/** Current periods for the overview. Historical averages are separate analytics. */
export function getCurrentGoalPercentages(): Record<string, number> {
  const value = currentWellness();
  return {
    ...getAllTimeGoalPercentages(),
    hydration: value.hydration.percentage,
    meditation: value.meditation.percentage,
    fasting: value.fasting.percentage,
    cardio: value.cardio.percentage,
  };
}

/**
 * Get all-time goal percentages for wellness score calculation
 */
export function getAllTimeGoalPercentages(): { [key: string]: number } {
  const goalValues = readWellnessGoals();
  const hydrationData = safeParseJSON(
    localStorage.getItem(STORAGE_KEYS.HYDRATION),
    {},
  ) as any;
  const hydrationPercentage = percentage(
    getAllTimeHydrationAverage(hydrationData?.logs ?? {}).averageOz,
    goalValues.hydrationOz,
  );
  const meditationData = safeParseJSON(
    localStorage.getItem(STORAGE_KEYS.MEDITATION),
    [],
  ) as any;
  const meditationSessions = Object.entries(
    dailyTotals("meditation", meditationData),
  ).map(([date, duration]) => ({ date, duration }));
  const meditationPercentage = percentage(
    getAllTimeMeditationAverage(meditationSessions).averageMinutes,
    goalValues.meditationMinutes,
  );
  const fastingLogs = safeParseJSON(
    localStorage.getItem(STORAGE_KEYS.FASTING),
    [],
  ) as any;
  const fastingPercentage = percentage(
    getAllTimeFastingAverage(fastingLogs).averageHours,
    goalValues.fastingHours,
  );
  const cardio = currentWellness().cardioData;
  const durations = dailyTotals("cardioDuration", cardio),
    distances = dailyTotals("cardioDistance", cardio);
  const entries = Object.keys(durations).map((date) => ({
    date,
    duration: durations[date],
    distance: distances[date] ?? 0,
  }));
  const cardioAverage = getAllTimeCardioAverage(entries);
  const cardioPercentage = percentage(
    cardio.goal.type === "distance"
      ? cardioAverage.averageDistance
      : cardioAverage.averageDuration,
    amount(cardio.goal.target) / (cardio.goal.period === "week" ? 7 : 1),
  );

  // Get measurements all-time percentage (weight and body fat)
  const measurements = safeParseJSON(
    localStorage.getItem(STORAGE_KEYS.MEASUREMENTS),
    {},
  ) as any;
  const weightEntries = measurements?.weight || [];
  const bodyFatEntries = measurements?.bodyFat || [];

  // The same recorded-baseline weight progress is used throughout the app.
  const weightPercentage = getWeightProgress().percentage;

  // Body fat percentage (latest vs target)
  const bodyFatGoal = getAllGoals().targetBodyFat;
  const latestBodyFat =
    bodyFatEntries.length > 0
      ? amount(bodyFatEntries[bodyFatEntries.length - 1].value)
      : 0;
  let bodyFatPercentage = 0;
  if (latestBodyFat > 0 && bodyFatGoal > 0) {
    const tolerance = bodyFatGoal * 0.1; // 10% tolerance
    const difference = Math.abs(latestBodyFat - bodyFatGoal);
    bodyFatPercentage = Math.max(0, 100 - (difference / tolerance) * 100);
  }

  return {
    hydration: hydrationPercentage,
    meditation: meditationPercentage,
    fasting: fastingPercentage,
    cardio: cardioPercentage,
    targetWeight: weightPercentage,
    targetBodyFat: bodyFatPercentage,
  };
}

/**
 * Calculate overall wellness score from all goals using user priority weights
 */
export function calculateWellnessScore(): number {
  // Get user's priority weights from localStorage
  const savedWeights = safeParseJSON(
    localStorage.getItem("fitcircle_wellness_weights"),
    null,
  );
  const rawWeights = savedWeights || {
    hydration: 20,
    meditation: 15,
    fasting: 15,
    cardio: 10,
    targetBodyFat: 10,
    targetWeight: 15,
    workoutConsistency: 15,
  };

  const weights = Object.fromEntries(
    Object.entries(rawWeights).map(([key, value]) => [key, amount(value)]),
  ) as typeof rawWeights;

  // Get all-time percentages
  const percentages = getCurrentGoalPercentages();

  // Get workout consistency (keep existing logic as it's already good)
  const consistency = getWorkoutConsistencyProgress();

  // Calculate weighted score
  const totalWeight = Object.values(weights).reduce(
    (sum, weight) => sum + weight,
    0,
  );
  if (totalWeight === 0) return 0;

  const weightedScore =
    (percentages.hydration * weights.hydration +
      percentages.meditation * weights.meditation +
      percentages.fasting * weights.fasting +
      percentages.cardio * weights.cardio +
      percentages.targetWeight * weights.targetWeight +
      percentages.targetBodyFat * weights.targetBodyFat +
      consistency.percentage * weights.workoutConsistency) /
    totalWeight;

  return Number.isFinite(weightedScore)
    ? Math.max(0, Math.min(100, Math.round(weightedScore)))
    : 0;
}
