import { PageHeader } from '@/components/ui/presentation';
import { applyRestore, prepareRestore } from "@/lib/backup";
import { CALCULATOR_TARGETS_CHANGED } from "@/lib/nutrition";
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
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

export default function FitnessCalculator() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState("calories");
  const tabs = [
    { id: "calories", label: "Calories" },
    { id: "weight", label: "Goal" },
    { id: "bmi", label: "BMI" },
    { id: "macros", label: "Macros" },
  ];
  const goBack = () => {
    if (window.history.state?.calculatorFrom) window.history.back();
    else navigate("/food-tracker", { replace: true });
  };

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
  const loadedWeightGoal = useRef<number | null | undefined>(undefined);
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
        // Target publications can refresh this page while a goal draft is open.
        // Only replace the draft when the persisted goal actually changes.
        if (loadedWeightGoal.current !== target) {
          loadedWeightGoal.current = target;
          setWeightGoal(target?.toString() ?? "");
        }
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
    <div
      className="fitcircle-page calculator-page"
      data-testid="fitness-calculator-page"
    >
      <div className="fitcircle-container">
        <PageHeader title="Fitness Calculator" onBack={goBack} />
        <div
          role="tablist"
          aria-label="Fitness calculators"
          className="calculator-tabs"
        >
          {tabs.map(({ id, label }, index) => (
            <button
              key={id}
              id={`calculator-tab-${id}`}
              role="tab"
              aria-selected={tab === id}
              aria-controls={`calculator-panel-${id}`}
              tabIndex={tab === id ? 0 : -1}
              onClick={() => setTab(id)}
              onKeyDown={(event) => {
                const offset =
                  event.key === "ArrowRight"
                    ? 1
                    : event.key === "ArrowLeft"
                      ? -1
                      : 0;
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? tabs.length - 1
                      : offset
                        ? (index + offset + tabs.length) % tabs.length
                        : null;
                if (next === null) return;
                event.preventDefault();
                setTab(tabs[next].id);
                document
                  .getElementById(`calculator-tab-${tabs[next].id}`)
                  ?.focus();
              }}
              className="calculator-tab"
            >
              <span>{label}</span>
            </button>
          ))}
        </div>

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

          {targetSaveError && (
            <p role="alert" className="text-sm text-feature-red mb-4">
              {targetSaveError}
            </p>
          )}
          <div
            role="tabpanel"
            id="calculator-panel-calories"
            aria-labelledby="calculator-tab-calories"
            hidden={tab !== "calories"}
          >
            {/* Calorie Tracker Section */}
            <div className="calculator-panel">
              <h2 className="calculator-eyebrow">Daily Calorie Target</h2>
              <div className="calculator-large-value text-accent-text">
                {!calorieTarget ? "—" : calorieTarget.toLocaleString()}
              </div>
              <p className="calculator-description">
                <span>calories per day</span> ·{" "}
                {goalType === "lose"
                  ? `Lose ${goalRate} lb/week`
                  : goalType === "gain"
                    ? `Gain ${goalRate} lb/week`
                    : "Maintain current weight"}
              </p>
              <hr className="calculator-divider" />
              <div className="space-y-4">
                {/* Activity Level Selection */}
                <div className="space-y-2">
                  <Label className="text-supporting">Activity Level</Label>
                  <Select
                    value={activityLevel}
                    onValueChange={(value) =>
                      changeSetting("activity", value, setActivityLevel)
                    }
                  >
                    <SelectTrigger className="calculator-field">
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
                      aria-label={goal.label}
                      aria-pressed={goalType === goal.value}
                      data-selected={goalType === goal.value}
                      data-goal-color={goal.color}
                      onClick={() =>
                        changeSetting("objective", goal.value, setGoalType)
                      }
                      className="calculator-direction"
                    >
                      {goal.value === "lose"
                        ? "Lose"
                        : goal.value === "gain"
                          ? "Gain"
                          : "Maintain"}
                    </button>
                  ))}
                </div>

                {goalType !== "maintain" && (
                  <div className="space-y-2">
                    <Label className="text-supporting">
                      Rate (lbs per week)
                    </Label>
                    <Select
                      value={goalRate}
                      onValueChange={(value) =>
                        changeSetting("rate", value, setGoalRate)
                      }
                    >
                      <SelectTrigger className="calculator-field">
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
          </div>
          <div
            role="tabpanel"
            id="calculator-panel-weight"
            aria-labelledby="calculator-tab-weight"
            hidden={tab !== "weight"}
          >
            <section className="calculator-panel">
              <h2 className="calculator-eyebrow">Goal Weight</h2>
              <div className="calculator-large-value">
                {savedWeightGoal ?? "—"}{" "}
                <span className="calculator-unit">lbs</span>
              </div>
              <p className="calculator-description">
                Your saved target for tracking weight progress.
              </p>
              <hr className="calculator-divider" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="calculator-current-weight">
                    Current Weight
                  </Label>
                  <div className="calculator-input-unit">
                    <Input
                      id="calculator-current-weight"
                      readOnly
                      value={userData.weight || ""}
                      placeholder="—"
                      className="calculator-field"
                    />
                    <span>lbs</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calculator-goal-weight">Target Weight</Label>
                  <div className="calculator-input-unit">
                    <Input
                      id="calculator-goal-weight"
                      aria-label="Goal weight (lbs)"
                      type="number"
                      min="1"
                      max="1500"
                      step="0.1"
                      value={weightGoal}
                      onChange={(event) => {
                        setWeightGoal(event.target.value);
                        setGoalSaved(false);
                      }}
                      className="calculator-field"
                    />
                    <span>lbs</span>
                  </div>
                </div>
                <Button className="calculator-save" onClick={saveGoal}>
                  Save Goal Weight
                </Button>
                <p className="text-sm text-supporting">
                  Your goal tracks weight progress. Update current weight in{" "}
                  <button
                    className="underline"
                    onClick={() => navigate("/measurements")}
                  >
                    Measurements
                  </button>
                  .
                </p>
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
          </div>
          <div
            role="tabpanel"
            id="calculator-panel-bmi"
            aria-labelledby="calculator-tab-bmi"
            hidden={tab !== "bmi"}
          >
            <section className="calculator-panel">
              <h2 className="calculator-eyebrow">BMI Calculator</h2>
              {userData.height > 0 && userData.weight > 0 ? (
                <>
                  <div className="calculator-bmi-layout">
                    <div className="calculator-gauge">
                      <svg
                        viewBox="0 0 180 180"
                        aria-label={`BMI ${bmi}`}
                        role="img"
                      >
                        <circle
                          cx="90"
                          cy="90"
                          r="78"
                          stroke="hsl(var(--progress-track))"
                          strokeWidth="14"
                          fill="none"
                        />
                        <circle
                          cx="90"
                          cy="90"
                          r="78"
                          stroke="var(--bmi-amber)"
                          strokeWidth="14"
                          fill="none"
                          strokeDasharray={`${(Math.min(100, (bmi / 40) * 100) * 4.4 * 78) / 70} ${(440 * 78) / 70}`}
                          strokeLinecap="round"
                          transform="rotate(-90 90 90)"
                        />
                      </svg>
                      <div className="calculator-gauge-label">
                        <strong>{bmi}</strong>
                        <span>{bmiInfo.category}</span>
                      </div>
                    </div>
                    <div className="space-y-4 min-w-0">
                      <div className="space-y-2">
                        <Label>Height</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            aria-label="Height feet"
                            readOnly
                            value={`${Math.floor(userData.height / 12)} ft`}
                            className="calculator-field"
                          />
                          <Input
                            aria-label="Height inches"
                            readOnly
                            value={`${userData.height % 12} in`}
                            className="calculator-field"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="calculator-bmi-weight">Weight</Label>
                        <div className="calculator-input-unit">
                          <Input
                            id="calculator-bmi-weight"
                            readOnly
                            value={userData.weight}
                            className="calculator-field"
                          />
                          <span>lbs</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/measurements")}
                        className="text-sm text-supporting underline"
                      >
                        Edit measurements
                      </button>
                    </div>
                  </div>
                  <div className="calculator-bmi-category">
                    <p className="text-supporting mb-1">BMI Category</p>
                    <p className="font-semibold text-feature-orange">
                      {bmiInfo.category} (
                      {bmi < 18.5
                        ? "below 18.5"
                        : bmi < 25
                          ? "18.5–24.9"
                          : bmi < 30
                            ? "25.0–29.9"
                            : "30.0 and above"}
                      )
                    </p>
                    <p className="text-sm text-supporting mt-2">
                      BMI is a screening measure and not a direct measure of
                      body fat.
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-supporting">
                    Add height and weight in Measurements to see your BMI
                  </p>
                  <Button
                    onClick={() => navigate("/measurements")}
                    className="calculator-save"
                  >
                    Go to Measurements
                  </Button>
                </div>
              )}
            </section>
          </div>
          <div
            role="tabpanel"
            id="calculator-panel-macros"
            aria-labelledby="calculator-tab-macros"
            hidden={tab !== "macros"}
          >
            <section className="calculator-panel">
              <h2 className="calculator-eyebrow">Macro Calculator</h2>
              <p className="text-supporting mb-4">
                Based on {!calorieTarget ? "—" : calorieTarget.toLocaleString()}{" "}
                daily calories
              </p>
              <div className="calculator-macro-grid">
                {[
                  { name: "Carbs", value: macros.carbs, color: "orange" },
                  { name: "Protein", value: macros.protein, color: "red" },
                  { name: "Fat", value: macros.fat, color: "blue" },
                ].map(({ name, value, color }) => (
                  <div
                    key={name}
                    className="calculator-macro-card"
                    data-color={color}
                  >
                    <h3>{name}</h3>
                    <strong>
                      {!calorieTarget || !macroPercentagesValid
                        ? "—"
                        : value.grams}
                      <span> g</span>
                    </strong>
                    <p>{value.percent}%</p>
                    <div
                      className="calculator-macro-track"
                      role="progressbar"
                      aria-label={`${name} allocation`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={
                        Number.isFinite(value.percent)
                          ? Math.max(0, Math.min(100, value.percent))
                          : 0
                      }
                    >
                      <div
                        style={{
                          width: `${Number.isFinite(value.percent) ? Math.max(0, Math.min(100, value.percent)) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <hr className="calculator-divider" />
              <div className="calculator-macro-controls">
                <Label htmlFor="macro-calories">Total Calories</Label>
                <div className="calculator-input-unit">
                  <Input
                    id="macro-calories"
                    readOnly
                    value={calorieTarget || ""}
                    placeholder="—"
                    className="calculator-field"
                  />
                  <span>cal/day</span>
                </div>
                {[
                  {
                    id: "macro-carbs",
                    label: "Carbs %",
                    value: customCarbs,
                    key: "carbs" as const,
                    update: setCustomCarbs,
                  },
                  {
                    id: "macro-protein",
                    label: "Protein %",
                    value: customProtein,
                    key: "protein" as const,
                    update: setCustomProtein,
                  },
                  {
                    id: "macro-fat",
                    label: "Fat %",
                    value: customFat,
                    key: "fat" as const,
                    update: setCustomFat,
                  },
                ].map(({ id, label, value, key, update }) => (
                  <React.Fragment key={id}>
                    <Label htmlFor={id}>{label}</Label>
                    <div className="calculator-input-unit">
                      <Input
                        id={id}
                        type="number"
                        step="any"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(event) =>
                          changeSetting(key, event.target.value, update)
                        }
                        className="calculator-field"
                      />
                      <span>%</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
              <p className="text-sm text-supporting mt-4">
                Macro percentages should total 100%.
              </p>
              {!macroPercentagesValid && (
                <p role="alert" className="text-sm text-warning mt-3">
                  Enter percentages from 0 to 100 that total 100%. Saved targets
                  stay unchanged until the split is valid.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
