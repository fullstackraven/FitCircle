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
  remainingGoalWeight,
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
  const remainingWeight = remainingGoalWeight(
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
    if (bmi < 18.5) return { category: "Low", color: "var(--bmi-blue)" }; // blue
    if (bmi >= 18.5 && bmi < 25)
      return { category: "Average", color: "var(--bmi-green)" }; // green
    if (bmi >= 25 && bmi < 30)
      return { category: "Above Average", color: "var(--bmi-amber)" }; // amber
    return { category: "High", color: "var(--bmi-red)" }; // red
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
            <p role="alert" className="text-sm text-warning-soft">
              {inputError}
            </p>
          )}

          {userData.age === null && (
            <div
              role="status"
              className="rounded-xl border border-amber-500/40 p-3 text-sm text-warning"
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
              <Target className="w-6 h-6 text-accent-text" />
              <h2 className="text-xl font-semibold text-strong">
                Calorie Tracker
              </h2>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <div className="type-metric text-3xl font-bold text-accent-text mb-2">
                  {!calorieTarget ? "—" : calorieTarget.toLocaleString()}
                </div>
                <div className="text-supporting">calories per day</div>
                <div className="text-sm text-muted-foreground mt-2">
                  {goalType === "lose"
                    ? `To lose ${goalRate} lb${goalRate !== "1" ? "s" : ""} per week`
                    : goalType === "gain"
                      ? `To gain ${goalRate} lb${goalRate !== "1" ? "s" : ""} per week`
                      : "To maintain current weight"}
                </div>
              </div>

              {/* Activity Level Selection */}
              <div className="space-y-2">
                <Label className="text-supporting">Activity Level</Label>
                <Select
                  value={activityLevel}
                  onValueChange={(value) =>
                    changeSetting("activity", value, setActivityLevel)
                  }
                >
                  <SelectTrigger className="bg-surface-secondary border-control text-strong">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-secondary border-control">
                    <SelectItem
                      value="sedentary"
                      className="text-strong hover:bg-control-strong"
                    >
                      Sedentary (little/no exercise)
                    </SelectItem>
                    <SelectItem
                      value="light"
                      className="text-strong hover:bg-control-strong"
                    >
                      Light (1-3 days/week)
                    </SelectItem>
                    <SelectItem
                      value="moderate"
                      className="text-strong hover:bg-control-strong"
                    >
                      Moderate (3-5 days/week)
                    </SelectItem>
                    <SelectItem
                      value="very"
                      className="text-strong hover:bg-control-strong"
                    >
                      Very Active (6-7 days/week)
                    </SelectItem>
                    <SelectItem
                      value="extremely"
                      className="text-strong hover:bg-control-strong"
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
                    aria-pressed={goalType === goal.value}
                    data-selected={goalType === goal.value}
                    data-goal-color={goal.color}
                    onClick={() =>
                      changeSetting("objective", goal.value, setGoalType)
                    }
                    className={`calculator-goal-option glass-control p-3 rounded-xl border-2 transition-colors text-sm flex items-center justify-center ${
                      goalType === goal.value
                        ? `border-${goal.color}-500 bg-${goal.color}-500/20 ${goal.color === "green" ? "text-accent-text" : goal.color === "blue" ? "text-feature-blue" : "text-feature-red"}`
                        : "border-control bg-surface-secondary text-supporting hover:border-control-muted-border"
                    }`}
                  >
                    {goal.label}
                  </button>
                ))}
              </div>

              {goalType !== "maintain" && (
                <div className="space-y-2">
                  <Label className="text-supporting">Rate (lbs per week)</Label>
                  <Select
                    value={goalRate}
                    onValueChange={(value) =>
                      changeSetting("rate", value, setGoalRate)
                    }
                  >
                    <SelectTrigger className="bg-surface-secondary border-control text-strong">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-secondary border-control">
                      <SelectItem
                        value="0.5"
                        className="text-strong hover:bg-control-strong"
                      >
                        0.5 lbs/week
                      </SelectItem>
                      <SelectItem
                        value="1"
                        className="text-strong hover:bg-control-strong"
                      >
                        1 lb/week
                      </SelectItem>
                      <SelectItem
                        value="1.5"
                        className="text-strong hover:bg-control-strong"
                      >
                        1.5 lbs/week
                      </SelectItem>
                      <SelectItem
                        value="2"
                        className="text-strong hover:bg-control-strong"
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
            <h2 className="text-xl font-semibold text-strong mb-4">
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
                className="bg-surface-secondary border-control text-strong"
              />
              <Button onClick={saveGoal}>Save</Button>
            </div>
            {goalError && (
              <p role="alert" className="text-sm text-feature-red mt-2">
                {goalError}
              </p>
            )}
            {goalSaved && (
              <p role="status" className="text-sm text-accent-text mt-2">
                Goal saved
              </p>
            )}
            {savedWeightGoal && userData.weight > 0 && (
              <div className="mt-4 text-sm text-supporting">
                <p>
                  {userData.weight} lb current · {savedWeightGoal} lb goal
                </p>
                {remainingWeight !== null && (
                  <p
                    className="mt-1 text-accent-text"
                    data-testid="weight-goal-status"
                  >
                    {remainingWeight === 0
                      ? goalType === "maintain"
                        ? "At goal weight"
                        : "Goal reached"
                      : goalType === "maintain"
                        ? `${remainingWeight.toFixed(1)} lb from goal weight`
                        : `${remainingWeight.toFixed(1)} lb to ${goalType}`}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* BMI Calculator Section */}
          <div className="fitcircle-card-lg">
            <div className="flex items-center space-x-3 mb-6">
              <Activity className="w-6 h-6 text-feature-blue" />
              <h2 className="text-xl font-semibold text-strong">
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
                      stroke="var(--bmi-track)"
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
                    <div className="type-metric text-2xl font-bold text-strong">
                      {bmi}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {bmiInfo.category}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-supporting space-y-1">
                  <div>
                    Height: {Math.floor(userData.height / 12)}'
                    {userData.height % 12}"
                  </div>
                  <div>Weight: {userData.weight} lbs</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-4">
                  Add height and weight in Measurements to see your BMI
                </div>
                <Button
                  onClick={() => navigate("/measurements")}
                  className="bg-blue-600 hover:bg-blue-700 text-on-action"
                >
                  Go to Measurements
                </Button>
              </div>
            )}
          </div>

          {/* Macro Calculator Section */}
          <div className="fitcircle-card-lg">
            <div className="flex items-center space-x-3 mb-6">
              <Calculator className="w-6 h-6 text-feature-purple" />
              <h2 className="text-xl font-semibold text-strong">
                Macro Calculator
              </h2>
            </div>

            {/* Personal macro percentages */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="macro-carbs" className="text-supporting text-sm">
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
                  className="bg-surface-secondary border-control text-strong mt-1"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label
                  htmlFor="macro-protein"
                  className="text-supporting text-sm"
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
                  className="bg-surface-secondary border-control text-strong mt-1"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label htmlFor="macro-fat" className="text-supporting text-sm">
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
                  className="bg-surface-secondary border-control text-strong mt-1"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            {!macroPercentagesValid && (
              <p role="alert" className="text-sm text-warning mb-4">
                Enter percentages from 0 to 100 that total 100%. Saved targets
                stay unchanged until the split is valid.
              </p>
            )}
            {targetSaveError && (
              <p role="alert" className="text-sm text-feature-red mb-4">
                {targetSaveError}
              </p>
            )}

            {/* Macro Breakdown */}
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="text-lg font-semibold text-strong">
                  {!calorieTarget ? "—" : calorieTarget.toLocaleString()}{" "}
                  calories/day
                </div>
              </div>

              {/* Macro Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-card bg-surface-secondary rounded-xl p-6 flex flex-col items-center justify-center">
                  <div className="text-feature-orange font-semibold mb-2">
                    Carbs
                  </div>
                  <div className="type-metric text-2xl font-bold text-strong">
                    {!calorieTarget || !macroPercentagesValid
                      ? "—"
                      : macros.carbs.grams + "g"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {macros.carbs.percent}%
                  </div>
                </div>
                <div className="glass-card bg-surface-secondary rounded-xl p-6 flex flex-col items-center justify-center">
                  <div className="text-feature-red font-semibold mb-2">Protein</div>
                  <div className="type-metric text-2xl font-bold text-strong">
                    {!calorieTarget || !macroPercentagesValid
                      ? "—"
                      : macros.protein.grams + "g"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {macros.protein.percent}%
                  </div>
                </div>
                <div className="glass-card bg-surface-secondary rounded-xl p-6 flex flex-col items-center justify-center">
                  <div className="text-feature-yellow font-semibold mb-2">Fat</div>
                  <div className="type-metric text-2xl font-bold text-strong">
                    {!calorieTarget || !macroPercentagesValid
                      ? "—"
                      : macros.fat.grams + "g"}
                  </div>
                  <div className="text-sm text-muted-foreground">
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
