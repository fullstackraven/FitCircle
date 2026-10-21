import {
  getAllGoals,
  updateGoal as writeGoal,
  getWeightProgress,
  getBodyFatProgress,
  getWorkoutConsistencyProgress,
} from "@/lib/goals-utils";
import { currentWellness } from "@/lib/wellness-storage";
import { useWellnessClock } from "./use-preserved-wellness";
import { useCallback } from "react";

export interface Goals {
  hydrationOz: number;
  meditationMinutes: number;
  fastingHours: number;
  maxFastingHours: number;
  weightLbs: number;
  targetWeight: number;
  targetBodyFat: number;
  workoutConsistency: number;
}

export interface GoalProgress {
  cardioProgress: number;
  hydrationProgress: number;
  meditationProgress: number;
  fastingProgress: number;
  weightProgress: number;
  targetWeightProgress: number;
  targetBodyFatProgress: number;
  workoutConsistencyProgress: number;
}

export function useGoals() {
  const now = useWellnessClock();
  const goals = { ...getAllGoals(), weightLbs: getAllGoals().targetWeight };
  const updateGoal = (key: keyof Goals, value: number) => {
    try {
      writeGoal(key === "weightLbs" ? "targetWeight" : key, value);
      return true;
    } catch (error) {
      console.error("Goals could not be saved safely", error);
      return false;
    }
  };
  const calculateProgress = useCallback(async (): Promise<GoalProgress> => {
    const value = currentWellness();
    const weight = getWeightProgress().percentage;
    return {
      hydrationProgress: value.hydration.percentage,
      meditationProgress: value.meditation.percentage,
      fastingProgress: value.fasting.percentage,
      cardioProgress: value.cardio.percentage,
      weightProgress: weight,
      targetWeightProgress: weight,
      targetBodyFatProgress: getBodyFatProgress().percentage,
      workoutConsistencyProgress: getWorkoutConsistencyProgress().percentage,
    };
  }, [JSON.stringify(goals), now.getTime()]);

  return {
    goals,
    updateGoal,
    calculateProgress,
  };
}
