import { applyRestore, prepareRestore } from "@/lib/backup";
import { CALCULATOR_TARGETS_CHANGED } from "@/lib/nutrition";
import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Calculator, Target, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { readFitnessProfile } from "@/lib/fitness-profile";
import {
  readMeasurementSnapshot,
  readWeightGoals,
  saveMeasurementGoals,
  weightGoalProgress,
  INTEGRATION_CHANGED,
} from "@/lib/measurement-integration";
import {
  saveCalculatorSettings,
  type Settings,
} from "@/lib/calculator-settings";

interface UserData {
  height: number; // inches
  weight: number; // lbs
  age: number | null;
  gender: string;
}

export default function FitnessCalculator({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [, navigate] = useLocation();

  // User data from measurements
  const [userData, setUserData] = useState<UserData>({
    height: 0,
    weight: 0,
    age: null,
    gender: "male",
  });

  // Calculator states with localStorage persistence
  const [activityLevel, setActivityLevel] = useState<string>(
    () => localStorage.getItem("fitness_calc_activity_level") ?? "moderate",
  );
  const [goalType, setGoalType] = useState<string>(
    () => localStorage.getItem("fitness_calc_goal_type") ?? "maintain",
  );
  const [goalRate, setGoalRate] = useState<string>(
    () => localStorage.getItem("fitness_calc_goal_rate") ?? "1",
  );
  const [customCarbs, setCustomCarbs] = useState<string>(
    () => localStorage.getItem("fitness_calc_custom_carbs") ?? "40",
  );
  const [customProtein, setCustomProtein] = useState<string>(
    () => localStorage.getItem("fitness_calc_custom_protein") ?? "30",
  );
  const [customFat, setCustomFat] = useState<string>(
    () => localStorage.getItem("fitness_calc_custom_fat") ?? "30",
  );

  const [weightGoal, setWeightGoal] = useState("");
  const [savedWeightGoal, setSavedWeightGoal] = useState<number | null>(null);
  const [startingWeight, setStartingWeight] = useState<number | null>(null);
  const [inputError, setInputError] = useState("");
  const [goalError, setGoalError] = useState("");
  const [goalSaved, setGoalSaved] = useState(false);

  useEffect(() => {
    const load = () => {
      try {
        const measurements = readMeasurementSnapshot();
        const profile = readFitnessProfile();
        if (profile.error) throw new Error(profile.error);
        setUserData({
          height: measurements.height?.value ?? 0,
          weight: measurements.weight?.value ?? 0,
          age: profile.age,
          gender: profile.record.gender === "female" ? "female" : "male",
        });
        setStartingWeight(measurements.startWeight?.value ?? null);
        setInputError("");
      } catch (error) {
        setInputError((error as Error).message);
        setUserData({ height: 0, weight: 0, age: null, gender: "male" });
      }
    };
    const loadGoal = () => {
      try {
        const target = readWeightGoals().targetWeight ?? null;
        setSavedWeightGoal(target);
        setWeightGoal(target?.toString() ?? "");
      } catch (error) {
        setGoalError((error as Error).message);
      }
    };
    load();
    loadGoal();
    const refresh = () => {
      load();
      loadGoal();
    };
    window.addEventListener("storage", refresh);
    window.addEventListener(INTEGRATION_CHANGED, refresh);
    window.addEventListener("fitcircleProfileChanged", load);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(INTEGRATION_CHANGED, refresh);
      window.removeEventListener("fitcircleProfileChanged", load);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const changeSetting = (
    key: keyof Settings,
    value: string,
    update: (value: string) => void,
  ) => {
    try {
      saveCalculatorSettings({ [key]: value });
      update(value);
      setTargetSaveError("");
    } catch (error) {
      setTargetSaveError((error as Error).message);
    }
  };
  const saveGoal = () => {
    try {
      const target = Number(weightGoal);
      if (!Number.isFinite(target) || target <= 0 || target > 1500)
        throw new Error("Enter a valid goal weight.");
      saveMeasurementGoals({ targetWeight: target });
      setSavedWeightGoal(target);
      setGoalError("");
      setGoalSaved(true);
    } catch (error) {
      setGoalError((error as Error).message);
      setGoalSaved(false);
    }
  };
  const goalProgress = weightGoalProgress(
    startingWeight,
    userData.weight || null,
    savedWeightGoal,
    goalType as "lose" | "maintain" | "gain",
  );

  // BMR calculation using Mifflin-St Jeor Equation
  const calculateBMR = () => {
    if (
      userData.age === null ||
      !userData.weight ||
      !userData.height ||
      inputError
    )
      return 0;
    const heightCm = userData.height * 2.54;
    const weightKg = userData.weight * 0.453592;

    if (userData.gender === "male") {
      return 10 * weightKg + 6.25 * heightCm - 5 * userData.age + 5;
    } else {
      return 10 * weightKg + 6.25 * heightCm - 5 * userData.age - 161;
    }
  };

  // TDEE calculation
  const calculateTDEE = () => {
    const bmr = calculateBMR();
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very: 1.725,
      extremely: 1.9,
    };
    return Math.round(
      bmr *
        activityMultipliers[activityLevel as keyof typeof activityMultipliers],
    );
  };

  // BMI calculation
  const calculateBMI = () => {
    const heightM = userData.height * 0.0254;
    const weightKg = userData.weight * 0.453592;
    return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  };

  // BMI category and color
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: "Low", color: "rgb(59, 130, 246)" }; // blue
    if (bmi >= 18.5 && bmi < 25)
      return { category: "Average", color: "rgb(34, 197, 94)" }; // green
    if (bmi >= 25 && bmi < 30)
      return { category: "Above Average", color: "rgb(245, 158, 11)" }; // amber
    return { category: "High", color: "rgb(239, 68, 68)" }; // red
  };

  // Calorie target based on goal
  const getCalorieTarget = () => {
    if (
      !calculateBMR() ||
      !["maintain", "lose", "gain"].includes(goalType) ||
      !goalRate.trim() ||
      !Number.isFinite(Number(goalRate)) ||
      Number(goalRate) < 0 ||
      Number(goalRate) > 2
    )
      return 0;
    const tdee = calculateTDEE();
    const rateNum = parseFloat(goalRate);
    const calorieAdjustment = rateNum * 500; // 500 calories per lb

    if (goalType === "lose") {
      return Math.round(tdee - calorieAdjustment);
    } else if (goalType === "gain") {
      return Math.round(tdee + calorieAdjustment);
    }
    return tdee;
  };

  // Macro calculations
  const calculateMacros = () => {
    const calories = getCalorieTarget();
    const carbPercent = Number(customCarbs);
    const proteinPercent = Number(customProtein);
    const fatPercent = Number(customFat);

    const carbCalories = calories * (carbPercent / 100);
    const proteinCalories = calories * (proteinPercent / 100);
    const fatCalories = calories * (fatPercent / 100);

    return {
      carbs: { grams: Math.round(carbCalories / 4), percent: carbPercent },
      protein: {
        grams: Math.round(proteinCalories / 4),
        percent: proteinPercent,
      },
      fat: { grams: Math.round(fatCalories / 9), percent: fatPercent },
    };
  };

  const bmi = calculateBMI();
  const bmiInfo = getBMICategory(bmi);
  const calorieTarget = getCalorieTarget();
  const macros = calculateMacros();

  const macroPercentagesValid =
    [customCarbs, customProtein, customFat].every(
      (value) =>
        value.trim() !== "" &&
        Number.isFinite(Number(value)) &&
        Number(value) >= 0 &&
        Number(value) <= 100,
    ) &&
    Math.abs(
      Number(customCarbs) + Number(customProtein) + Number(customFat) - 100,
    ) < 0.000001;
  const [targetSaveError, setTargetSaveError] = useState("");
  // Publish complete calculator targets to the mounted Food Tracker as well as other tabs.
  useEffect(() => {
    if (
      userData.age === null ||
      !Number.isFinite(calorieTarget) ||
      calorieTarget <= 0 ||
      !macroPercentagesValid
    )
      return;
    try {
      applyRestore(
        prepareRestore({
          fitness_calc_target_calories: calorieTarget.toString(),
          fitness_calc_target_carbs: macros.carbs.grams.toString(),
          fitness_calc_target_protein: macros.protein.grams.toString(),
          fitness_calc_target_fat: macros.fat.grams.toString(),
        }),
      );
      window.dispatchEvent(new Event(CALCULATOR_TARGETS_CHANGED));
    } catch {
      setTargetSaveError(
        "Could not save calculator targets. Check available storage and try again.",
      );
    }
  }, [
    calorieTarget,
    macros.carbs.grams,
    macros.protein.grams,
    macros.fat.grams,
    userData.age,
    macroPercentagesValid,
  ]);

  return (
    <div className="fitcircle-page">
      <div className="fitcircle-container">
        {/* Header */}
        {!embedded && (
          <div className="text-center mb-8">
            <h1 className="fitcircle-page-title">Fitness Calculator</h1>
          </div>
        )}

        <div className="space-y-8">
          {inputError && (
            <p role="alert" className="text-sm text-amber-300">
              {inputError}
            </p>
          )}

          {userData.age === null && (
            <div
              role="status"
              className="rounded-xl border border-amber-500/40 p-3 text-sm text-amber-200"
            >
              A saved age or date of birth is needed for calorie and macro
              targets. Existing targets are kept.
              <Button variant="link" onClick={() => navigate("/profile")}>
                Open My Fitness Profile
              </Button>
            </div>
          )}

          {/* Calorie Tracker Section */}
          <div className="fitcircle-card-lg">
            <div className="flex items-center space-x-3 mb-6">
              <Target className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-semibold text-white">
                Calorie Tracker
              </h2>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <div className="type-metric text-3xl font-bold text-green-400 mb-2">
                  {!calorieTarget ? "—" : calorieTarget.toLocaleString()}
                </div>
                <div className="text-slate-300">calories per day</div>
                <div className="text-sm text-slate-400 mt-2">
                  {goalType === "lose"
                    ? `To lose ${goalRate} lb${goalRate !== "1" ? "s" : ""} per week`
                    : goalType === "gain"
                      ? `To gain ${goalRate} lb${goalRate !== "1" ? "s" : ""} per week`
                      : "To maintain current weight"}
                </div>
              </div>

              {/* Activity Level Selection */}
              <div className="space-y-2">
                <Label className="text-slate-300">Activity Level</Label>
                <Select
                  value={activityLevel}
                  onValueChange={(value) =>
                    changeSetting("activity", value, setActivityLevel)
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem
                      value="sedentary"
                      className="text-white hover:bg-slate-600"
                    >
                      Sedentary (little/no exercise)
                    </SelectItem>
                    <SelectItem
                      value="light"
                      className="text-white hover:bg-slate-600"
                    >
                      Light (1-3 days/week)
                    </SelectItem>
                    <SelectItem
                      value="moderate"
                      className="text-white hover:bg-slate-600"
                    >
                      Moderate (3-5 days/week)
                    </SelectItem>
                    <SelectItem
                      value="very"
                      className="text-white hover:bg-slate-600"
                    >
                      Very Active (6-7 days/week)
                    </SelectItem>
                    <SelectItem
                      value="extremely"
                      className="text-white hover:bg-slate-600"
                    >
                      Extremely Active (2x/day)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Goal Type Selection */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "lose", label: "Lose Weight", color: "red" },
                  { value: "maintain", label: "Maintain", color: "blue" },
                  { value: "gain", label: "Gain Weight", color: "green" },
                ].map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() =>
                      changeSetting("objective", goal.value, setGoalType)
                    }
                    className={`glass-control p-3 rounded-xl border-2 transition-colors text-sm flex items-center justify-center ${
                      goalType === goal.value
                        ? `border-${goal.color}-500 bg-${goal.color}-500/20 text-${goal.color}-400`
                        : "border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    {goal.label}
                  </button>
                ))}
              </div>

              {goalType !== "maintain" && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Rate (lbs per week)</Label>
                  <Select
                    value={goalRate}
                    onValueChange={(value) =>
                      changeSetting("rate", value, setGoalRate)
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem
                        value="0.5"
                        className="text-white hover:bg-slate-600"
                      >
                        0.5 lbs/week
                      </SelectItem>
                      <SelectItem
                        value="1"
                        className="text-white hover:bg-slate-600"
                      >
                        1 lb/week
                      </SelectItem>
                      <SelectItem
                        value="1.5"
                        className="text-white hover:bg-slate-600"
                      >
                        1.5 lbs/week
                      </SelectItem>
                      <SelectItem
                        value="2"
                        className="text-white hover:bg-slate-600"
                      >
                        2 lbs/week
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <section className="fitcircle-card-lg">
            <h2 className="text-xl font-semibold text-white mb-4">
              Goal Weight
            </h2>
            <Label htmlFor="calculator-goal-weight">Goal weight (lbs)</Label>
            <div className="flex gap-3 mt-2">
              <Input
                id="calculator-goal-weight"
                type="number"
                min="1"
                max="1500"
                step="0.1"
                value={weightGoal}
                onChange={(event) => {
                  setWeightGoal(event.target.value);
                  setGoalSaved(false);
                }}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Button onClick={saveGoal}>Save</Button>
            </div>
            {goalError && (
              <p role="alert" className="text-sm text-red-400 mt-2">
                {goalError}
              </p>
            )}
            {goalSaved && (
              <p role="status" className="text-sm text-green-400 mt-2">
                Goal saved
              </p>
            )}
            {savedWeightGoal && userData.weight > 0 && (
              <div className="mt-4 text-sm text-slate-300">
                <p>
                  {userData.weight} lb current · {savedWeightGoal} lb goal
                </p>
                {goalProgress === null &&
                  startingWeight !== null &&
                  (goalType === "lose" || goalType === "gain") && (
                    <p className="mt-1">
                      Choose a goal {goalType === "lose" ? "below" : "above"}{" "}
                      your starting weight of {startingWeight} lb.
                    </p>
                  )}
                {goalProgress !== null && (
                  <>
                    <div
                      role="progressbar"
                      aria-label="Weight goal progress"
                      aria-valuenow={Math.round(goalProgress)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-2 rounded-full bg-slate-700 mt-2 overflow-hidden"
                    >
                      <div
                        className="h-full bg-green-400"
                        style={{ width: goalProgress + "%" }}
                      />
                    </div>
                    <p className="mt-1">
                      {goalType === "maintain"
                        ? goalProgress === 100
                          ? "At goal weight"
                          : `${Math.abs(userData.weight - savedWeightGoal).toFixed(1)} lb from goal weight`
                        : `${Math.round(goalProgress)}% from first recorded weight`}
                    </p>
                  </>
                )}
              </div>
            )}
          </section>

          {/* BMI Calculator Section */}
          <div className="fitcircle-card-lg">
            <div className="flex items-center space-x-3 mb-6">
              <Activity className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                BMI Calculator
              </h2>
            </div>

            {userData.height > 0 && userData.weight > 0 ? (
              <div className="text-center space-y-4">
                {/* BMI Circle Display */}
                <div className="relative inline-block">
                  <svg
                    width="160"
                    height="160"
                    className="transform -rotate-90"
                  >
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="rgb(71, 85, 105)"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke={bmiInfo.color}
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${Math.min(100, (bmi / 40) * 100) * 4.4} 440`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="type-metric text-2xl font-bold text-white">
                      {bmi}
                    </div>
                    <div className="text-sm text-slate-400">
                      {bmiInfo.category}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-slate-300 space-y-1">
                  <div>
                    Height: {Math.floor(userData.height / 12)}'
                    {userData.height % 12}"
                  </div>
                  <div>Weight: {userData.weight} lbs</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-400 mb-4">
                  Add height and weight in Measurements to see your BMI
                </div>
                <Button
                  onClick={() => navigate("/measurements")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Go to Measurements
                </Button>
              </div>
            )}
          </div>

          {/* Macro Calculator Section */}
          <div className="fitcircle-card-lg">
            <div className="flex items-center space-x-3 mb-6">
              <Calculator className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">
                Macro Calculator
              </h2>
            </div>

            {/* Personal macro percentages */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="macro-carbs" className="text-slate-300 text-sm">
                  Carbs %
                </Label>
                <Input
                  type="number"
                  step="any"
                  id="macro-carbs"
                  value={customCarbs}
                  onChange={(e) =>
                    changeSetting("carbs", e.target.value, setCustomCarbs)
                  }
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label
                  htmlFor="macro-protein"
                  className="text-slate-300 text-sm"
                >
                  Protein %
                </Label>
                <Input
                  type="number"
                  step="any"
                  id="macro-protein"
                  value={customProtein}
                  onChange={(e) =>
                    changeSetting("protein", e.target.value, setCustomProtein)
                  }
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label htmlFor="macro-fat" className="text-slate-300 text-sm">
                  Fat %
                </Label>
                <Input
                  type="number"
                  step="any"
                  id="macro-fat"
                  value={customFat}
                  onChange={(e) =>
                    changeSetting("fat", e.target.value, setCustomFat)
                  }
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            {!macroPercentagesValid && (
              <p role="alert" className="text-sm text-amber-200 mb-4">
                Enter percentages from 0 to 100 that total 100%. Saved targets
                stay unchanged until the split is valid.
              </p>
            )}
            {targetSaveError && (
              <p role="alert" className="text-sm text-red-400 mb-4">
                {targetSaveError}
              </p>
            )}

            {/* Macro Breakdown */}
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="text-lg font-semibold text-white">
                  {!calorieTarget ? "—" : calorieTarget.toLocaleString()}{" "}
                  calories/day
                </div>
              </div>

              {/* Macro Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-card bg-slate-700 rounded-xl p-6 flex flex-col items-center justify-center">
                  <div className="text-orange-400 font-semibold mb-2">
                    Carbs
                  </div>
                  <div className="type-metric text-2xl font-bold text-white">
                    {!calorieTarget || !macroPercentagesValid
                      ? "—"
                      : macros.carbs.grams + "g"}
                  </div>
                  <div className="text-sm text-slate-400">
                    {macros.carbs.percent}%
                  </div>
                </div>
                <div className="glass-card bg-slate-700 rounded-xl p-6 flex flex-col items-center justify-center">
                  <div className="text-red-400 font-semibold mb-2">Protein</div>
                  <div className="type-metric text-2xl font-bold text-white">
                    {!calorieTarget || !macroPercentagesValid
                      ? "—"
                      : macros.protein.grams + "g"}
                  </div>
                  <div className="text-sm text-slate-400">
                    {macros.protein.percent}%
                  </div>
                </div>
                <div className="glass-card bg-slate-700 rounded-xl p-6 flex flex-col items-center justify-center">
                  <div className="text-yellow-400 font-semibold mb-2">Fat</div>
                  <div className="type-metric text-2xl font-bold text-white">
                    {!calorieTarget || !macroPercentagesValid
                      ? "—"
                      : macros.fat.grams + "g"}
                  </div>
                  <div className="text-sm text-slate-400">
                    {macros.fat.percent}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
