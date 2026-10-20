import { readFitnessProfile } from "./fitness-profile";
import { getTodayString, parseLocalDate } from "./date-utils";
import {
  readMeasurementSnapshot,
  readWeightGoals,
  readObject,
  notifyIntegration,
  type Direction,
} from "./measurement-integration";
import { applyRestore, prepareRestore } from "./backup";
import type { Targets } from "./nutrition";
export const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extremely: 1.9,
};
export function readCalculatorSettings(storage: Storage = localStorage) {
  return {
    activity: storage.getItem("fitness_calc_activity_level") ?? "moderate",
    objective: storage.getItem("fitness_calc_goal_type") ?? "maintain",
    rate: storage.getItem("fitness_calc_goal_rate") ?? "1",
    carbs: storage.getItem("fitness_calc_custom_carbs") ?? "40",
    protein: storage.getItem("fitness_calc_custom_protein") ?? "30",
    fat: storage.getItem("fitness_calc_custom_fat") ?? "30",
  };
}
export type Settings = ReturnType<typeof readCalculatorSettings>;
export type Recommendation = {
  targets: Targets;
  bmr: number;
  tdee: number;
  objective: Direction;
  inputs: {
    weight: number;
    height: number;
    age: number;
    sex: "male" | "female";
    weightDate: string | null;
    heightDate: string | null;
    activity: string;
    rate: number;
    measurementGoal: number | null;
  };
};
export function calculateRecommendation(
  input: Recommendation["inputs"],
  settings: Settings,
): Recommendation {
  const split = [settings.carbs, settings.protein, settings.fat].map(Number);
  if (
    [settings.carbs, settings.protein, settings.fat].some(
      (v) => v.trim() === "",
    ) ||
    split.some((v) => !Number.isFinite(v) || v < 0 || v > 100) ||
    Math.abs(split.reduce((a, b) => a + b, 0) - 100) > 1e-6
  )
    throw Error("Macro percentages must total 100%.");
  const multiplier =
      activityMultipliers[
        settings.activity as keyof typeof activityMultipliers
      ],
    rate = Number(settings.rate);
  if (
    !multiplier ||
    !["gain", "lose", "maintain"].includes(settings.objective) ||
    settings.rate.trim() === "" ||
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > 2
  )
    throw Error(
      "Check activity, objective and weight-change rate (0–2 lb/week).",
    );
  if (!(
    input.weight > 0 &&
    input.weight <= 1500 &&
    input.height >= 24 &&
    input.height <= 108 &&
    input.age >= 18 &&
    input.age <= 120
  ))
    throw Error(
      "Recorded inputs are outside the adult calculator range. Check Measurements and Profile.",
    );
  const bmr =
    10 * (input.weight * 0.453592) +
    6.25 * (input.height * 2.54) -
    5 * input.age +
    (input.sex === "male" ? 5 : -161);
  const tdee = Math.round(bmr * multiplier);
  const calories = Math.round(
    tdee +
      (settings.objective === "gain"
        ? 1
        : settings.objective === "lose"
          ? -1
          : 0) *
        rate *
        500,
  );
  if (calories < 800 || calories > 10000)
    throw Error(
      "Calculated intake is outside the supported range. Review your inputs and rate.",
    );
  return {
    bmr,
    tdee,
    objective: settings.objective as Direction,
    inputs: { ...input, activity: settings.activity, rate },
    targets: {
      calories,
      carbs: Math.round((calories * split[0]) / 100 / 4),
      protein: Math.round((calories * split[1]) / 100 / 4),
      fat: Math.round((calories * split[2]) / 100 / 9),
    },
  };
}
export function readRecommendation(
  storage: Storage = localStorage,
  today = getTodayString(),
) {
  try {
    const measurements = readMeasurementSnapshot(storage, today),
      goals = readWeightGoals(storage, measurements.weight?.value ?? null),
      profile = readFitnessProfile(storage, parseLocalDate(today)),
      settings = readCalculatorSettings(storage);
    const issues: string[] = [];
    if (profile.error) issues.push(profile.error);
    if (!measurements.weight)
      issues.push("Record your weight in Measurements.");
    if (!measurements.height)
      issues.push("Record your height in Measurements.");
    if (profile.age === null)
      issues.push("Add your age or date of birth in My Fitness Profile.");
    const sex = profile.record.gender;
    if (sex !== "male" && sex !== "female")
      issues.push("Choose calculation sex.");
    let recommendation: Recommendation | null = null;
    if (!issues.length) {
      try {
        recommendation = calculateRecommendation(
          {
            weight: measurements.weight!.value,
            height: measurements.height!.value,
            age: profile.age!,
            sex: sex as "male" | "female",
            weightDate: measurements.weight!.date,
            heightDate: measurements.height!.date,
            activity: settings.activity,
            rate: Number(settings.rate),
            measurementGoal: goals.targetWeight,
          },
          settings,
        );
      } catch (failure) {
        issues.push((failure as Error).message);
      }
    }
    return {
      measurements,
      goals,
      profile,
      settings,
      recommendation,
      issues,
      error: null as string | null,
    };
  } catch (failure) {
    return {
      measurements: null,
      goals: null,
      profile: null,
      settings: null,
      recommendation: null,
      issues: [],
      error:
        failure instanceof Error
          ? failure.message
          : "Saved inputs could not be read safely.",
    };
  }
}
export function saveCalculatorSettings(
  patch: Partial<Settings>,
  storage: Storage = localStorage,
) {
  const keys: Record<keyof Settings, string> = {
    activity: "fitness_calc_activity_level",
    objective: "fitness_calc_goal_type",
    rate: "fitness_calc_goal_rate",
    carbs: "fitness_calc_custom_carbs",
    protein: "fitness_calc_custom_protein",
    fat: "fitness_calc_custom_fat",
  };
  const entries = Object.fromEntries(
    Object.entries(patch).map(([key, value]) => [
      keys[key as keyof Settings],
      value,
    ]),
  );
  applyRestore(prepareRestore(entries), storage, storage);
  notifyIntegration();
}
export function saveCalculationSex(
  sex: "male" | "female",
  storage: Storage = localStorage,
) {
  const record = readObject(storage.getItem("fitcircle_profile"), "Profile");
  applyRestore(
    prepareRestore({
      fitcircle_profile: JSON.stringify({ ...record, gender: sex }),
    }),
    storage,
    storage,
  );
  notifyIntegration();
}
