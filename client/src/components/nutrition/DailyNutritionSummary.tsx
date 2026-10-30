import { formatNutritionDisplay } from '@/lib/nutrition-display';
import { calorieBalance, dailyNutrition, type Targets } from "@/lib/nutrition";
import type { FoodEntry } from "@/lib/local-food-service";
export function NutritionProgress({
  value,
  target,
  label,
  color = "bg-nutrition-green",
}: {
  value: number;
  target: number;
  label: string;
  color?: string;
}) {
  const percent =
    target > 0 ? Math.min(100, Math.max(0, (value / target) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      aria-valuetext={`${value.toFixed(1)} of ${target}`}
      className="h-2 rounded-full bg-nutrition-track overflow-hidden"
    >
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
export function DailyNutritionSummary({
  entries,
  targets,
  confirmed,
}: {
  entries: FoodEntry[];
  targets: Targets;
  confirmed: boolean;
}) {
  const totals = dailyNutrition(entries);
  const calories = totals.calories.value;
  const balance = calorieBalance(calories, targets.calories);
  return (
    <section aria-label="Daily nutrition overview" className="space-y-3">
      <div className="rounded-2xl bg-surface p-4 space-y-3">
        <div className="flex justify-between gap-3 items-start">
          <div>
            <h2 className="text-sm text-supporting">
              {balance.over > 0 ? "Above daily target" : "Calories remaining"}
            </h2>
            <p
              className="type-metric text-4xl font-bold text-strong mt-1"
              data-testid="calories-remaining"
            >
              {Math.round(balance.over || balance.remaining).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="type-metric text-xl font-bold text-accent-text">
              {Math.round(balance.percent)}%
            </p>
            <p className="text-xs text-muted-foreground">of daily target consumed</p>
          </div>
        </div>
        <NutritionProgress
          value={calories}
          target={targets.calories}
          label="Calories consumed"
        />
        <div className="flex justify-between gap-2 text-sm text-muted-foreground">
          <span>{Math.round(calories).toLocaleString()} consumed</span>
          <span>{formatNutritionDisplay(targets.calories, "calories")} target</span>
        </div>
        {balance.over > 0 && (
          <p className="text-xs text-supporting">
            {Math.round(balance.over)} kcal above your target. Your intake is
            still recorded in full.
          </p>
        )}
        {!confirmed && (
          <p className="text-xs text-muted-foreground">
            Reference targets — set your targets in Fitness Calculator.
          </p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ["protein", "Protein", "bg-nutrition-green"],
            ["carbs", "Carbs", "bg-nutrition-blue"],
            ["fat", "Fat", "bg-nutrition-amber"],
          ] as const
        ).map(([key, label, color]) => (
          <div key={key} className="rounded-xl bg-surface p-3 min-w-0">
            <h3 className="text-sm text-supporting mb-2">{label}</h3>
            <p className="tabular-nums text-sm font-semibold text-strong mb-2 break-words">
              {formatNutritionDisplay(totals[key].value)}{" "}
              <span className="text-muted-foreground font-normal">
                / {formatNutritionDisplay(targets[key])}g
              </span>
            </p>
            <NutritionProgress
              value={totals[key].value}
              target={targets[key]}
              label={label}
              color={color}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
