import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  goalPurposes,
  nutrientLabels,
  nutritionGoalsSchema,
  readCalculatorEstimate,
  saveNutritionGoals,
  type NutritionGoals as Goals,
  type Targets,
} from "@/lib/nutrition";
export function NutritionGoals({
  current,
  reference,
  onSaved,
  onCalculator,
}: {
  current: Goals | null;
  reference: Targets;
  onSaved: (goals: Goals) => void;
  onCalculator: () => void;
}) {
  const [values, setValues] = useState(
    Object.fromEntries(
      Object.entries(current ?? reference)
        .filter(([key]) =>
          ["calories", "protein", "carbs", "fat"].includes(key),
        )
        .map(([key, value]) => [key, String(value)]),
    ),
  );
  const [purpose, setPurpose] = useState<Goals["purpose"]>(current?.purpose);
  const [error, setError] = useState("");
  const [estimateNote, setEstimateNote] = useState("");
  const save = () => {
    try {
      if (
        (["calories", "protein", "carbs", "fat"] as const).some(
          (key) => !values[key]?.trim(),
        )
      )
        throw new Error(
          "Enter every target, including explicit zero values where appropriate.",
        );
      const goals = nutritionGoalsSchema.parse({
        ...Object.fromEntries(
          Object.entries(values).map(([key, value]) => [key, Number(value)]),
        ),
        purpose,
      });
      onSaved(saveNutritionGoals(goals));
    } catch {
      setError(
        "Targets could not be saved. Check the values (calories must be positive), available storage, and any unreadable saved goals. Your previous goals are unchanged.",
      );
    }
  };
  const useEstimate = () => {
    try {
      const estimate = readCalculatorEstimate();
      if (!estimate) {
        setEstimateNote(
          "No saved calculator estimate is available. Open Fitness Calculator to review your profile and settings.",
        );
        return;
      }
      setValues(
        Object.fromEntries(
          Object.entries(estimate)
            .filter(([key]) =>
              ["calories", "protein", "carbs", "fat"].includes(key),
            )
            .map(([key, value]) => [key, String(value)]),
        ),
      );
      setEstimateNote(
        "Saved calculator estimate copied for review. Edit any value, then Save Goals to apply. Estimates may reflect older profile settings.",
      );
    } catch {
      setEstimateNote(
        "The saved estimate could not be read. You can enter targets manually.",
      );
    }
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Your targets stay fixed until you save a change. Exercise calories and
        profile edits do not adjust them automatically.
      </p>
      <label className="block text-sm text-slate-300">
        Nutrition focus (optional)
        <select
          aria-label="Nutrition focus"
          value={purpose ?? ""}
          onChange={(event) =>
            setPurpose((event.target.value as Goals["purpose"]) || undefined)
          }
          className="w-full min-h-11 mt-1 rounded-xl bg-slate-800 px-3"
        >
          <option value="">Choose a focus</option>
          {goalPurposes.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <p className="text-xs text-slate-400">
        Focus is a preference. It does not impose a deficit or surplus; set your
        targets below.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {(["calories", "protein", "carbs", "fat"] as const).map((key) => (
          <label key={key} className="text-sm text-slate-300">
            {nutrientLabels[key][0]} ({nutrientLabels[key][1]})
            <Input
              aria-label={`${nutrientLabels[key][0]} target`}
              type="number"
              min={key === "calories" ? 1 : 0}
              step="any"
              value={values[key] ?? ""}
              onChange={(event) =>
                setValues({ ...values, [key]: event.target.value })
              }
              className="mt-1 text-base"
            />
          </label>
        ))}
      </div>
      <div className="rounded-xl bg-slate-800 p-3 space-y-2">
        <p className="text-sm text-slate-300">Optional starting estimates</p>
        <Button variant="outline" className="w-full" onClick={useEstimate}>
          Review Saved Calculator Estimate
        </Button>
        <Button
          variant="ghost"
          className="w-full text-green-400"
          onClick={onCalculator}
        >
          Open Fitness Calculator
        </Button>
        <p className="text-xs text-slate-400">
          Uses the calculator’s existing goal, activity, age and measurements.
          Check My Fitness Profile when those inputs need updating.
        </p>
        {estimateNote && (
          <p role="status" className="text-xs text-slate-300">
            {estimateNote}
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      <Button
        onClick={save}
        className="w-full bg-green-400 text-slate-950 hover:bg-green-300"
      >
        Save Goals
      </Button>
    </div>
  );
}
