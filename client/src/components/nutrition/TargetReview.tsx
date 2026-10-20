import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  saveNutritionGoals,
  nutritionGoalsSchema,
  type NutritionGoals,
  type Targets,
} from "@/lib/nutrition";
import { notifyIntegration } from "@/lib/measurement-integration";
import type { Recommendation } from "@/lib/fitness-recommendation";
const fields = ["calories", "protein", "carbs", "fat"] as const;
export function TargetReview({
  current,
  confirmed,
  recommendation,
  recommendationError,
  blocked,
  onSaved,
  onCalculator,
  onSettings,
}: {
  current: Targets;
  confirmed: NutritionGoals | null;
  recommendation: Recommendation | null;
  recommendationError?: string | null;
  blocked: boolean;
  onSaved: () => void;
  onCalculator: () => void;
  onSettings: () => void;
}) {
  const [editing, setEditing] = useState(false),
    [pending, setPending] = useState<Recommendation | null>(null),
    [error, setError] = useState("");
  const [draft, setDraft] = useState(
    () =>
      Object.fromEntries(
        fields.map((key) => [key, String(current[key])]),
      ) as Record<(typeof fields)[number], string>,
  );
  const changed =
    !!recommendation &&
    (!confirmed ||
      fields.some((key) => recommendation.targets[key] !== confirmed[key]));
  const save = (recommended: boolean) => {
    try {
      if (blocked)
        throw Error(
          "Restore verified nutrition goals in Settings before editing.",
        );
      if (recommended && !recommendation)
        throw Error("Complete the calculator inputs first.");
      if (
        recommended &&
        (!pending || JSON.stringify(pending) !== JSON.stringify(recommendation))
      ) {
        setPending(null);
        throw Error("Recommendation changed. Review it again before applying.");
      }
      const targets = recommended
        ? pending!.targets
        : (Object.fromEntries(
            fields.map((key) => [
              key,
              draft[key].trim() === "" ? NaN : Number(draft[key]),
            ]),
          ) as Targets);
      if (!nutritionGoalsSchema.safeParse(targets).success)
        throw Error(
          "Enter a positive calorie target and valid nonnegative macro targets.",
        );
      saveNutritionGoals({
        ...targets,
        source: recommended ? "calculator" : "manual",
        confirmedAt: new Date().toISOString(),
        ...(recommended
          ? { recommendation: pending! }
          : { recommendation: undefined }),
      });
      setError("");
      setEditing(false);
      setPending(null);
      notifyIntegration();
      onSaved();
    } catch (failure) {
      setError((failure as Error).message);
    }
  };
  return (
    <details
      className="rounded-xl border border-slate-700 p-3 my-3"
      data-testid="target-review"
    >
      <summary className="cursor-pointer text-sm text-green-400">
        {changed
          ? "Review calculator recommendation"
          : "Current Nutrition Goals"}
      </summary>
      <div className="space-y-3 mt-3">
        <p className="text-sm text-slate-300">
          Current Nutrition Goals ·{" "}
          {confirmed
            ? confirmed.source === "calculator"
              ? "Calculator-derived"
              : "Manually confirmed"
            : "Not yet confirmed"}
        </p>
        <p className="text-sm tabular-nums text-white">
          {current.calories} kcal · P {current.protein}g · C {current.carbs}g ·
          F {current.fat}g
        </p>
        <Button
          variant="outline"
          disabled={blocked}
          onClick={() => {
            setDraft(
              Object.fromEntries(
                fields.map((key) => [key, String(current[key])]),
              ) as typeof draft,
            );
            setEditing(!editing);
            setPending(null);
          }}
        >
          Edit current targets
        </Button>
        {editing && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {fields.map((key) => (
                <label key={key} className="text-sm text-slate-300">
                  {key[0].toUpperCase() + key.slice(1)} target
                  <Input
                    aria-label={`${key[0].toUpperCase() + key.slice(1)} target`}
                    type="number"
                    min={key === "calories" ? 1 : 0}
                    step="any"
                    value={draft[key]}
                    onChange={(event) =>
                      setDraft({ ...draft, [key]: event.target.value })
                    }
                  />
                </label>
              ))}
            </div>
            <Button onClick={() => save(false)} disabled={blocked}>
              Confirm manual targets
            </Button>
          </div>
        )}
        {recommendation ? (
          <div className="space-y-2 border-t border-slate-700 pt-3">
            <h3 className="text-sm font-semibold">
              Calculator Recommendation · {recommendation.objective}
            </h3>
            <p className="tabular-nums text-sm">
              {recommendation.targets.calories} kcal · P{" "}
              {recommendation.targets.protein}g · C{" "}
              {recommendation.targets.carbs}g · F {recommendation.targets.fat}g
            </p>
            <p className="text-xs text-slate-400">
              {recommendation.inputs.weight} lb · {recommendation.inputs.height}{" "}
              in · Age {recommendation.inputs.age} · {recommendation.inputs.sex}{" "}
              · {recommendation.inputs.activity} ·{" "}
              {recommendation.objective === "maintain"
                ? "Maintenance"
                : `${recommendation.inputs.rate} lb/week`}
            </p>
            {!pending ? (
              <Button
                disabled={blocked}
                onClick={() => {
                  setPending(recommendation);
                  setEditing(false);
                }}
              >
                Apply Recommended Targets
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm">Replace current nutrition targets?</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPending(null)}>
                    Cancel
                  </Button>
                  <Button disabled={blocked} onClick={() => save(true)}>
                    Confirm Apply
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            {recommendationError ??
              "Complete Measurements and Fitness Calculator to get a recommendation."}
          </p>
        )}
        <Button variant="ghost" onClick={onCalculator}>
          Fitness Calculator
        </Button>
        {(blocked || recommendationError) && (
          <Button variant="outline" onClick={onSettings}>
            Open Settings
          </Button>
        )}
        {error && (
          <p role="alert" className="text-sm text-amber-300">
            {error}
          </p>
        )}
      </div>
    </details>
  );
}
