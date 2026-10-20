import { applyRestore, prepareRestore } from "./backup";
import { notifyIntegration } from "./measurement-integration";
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
