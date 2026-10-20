import { nutritionWeek, nutrientLabels, type Targets } from "@/lib/nutrition";
import { readFoodDay } from "@/lib/food-diary";
export function WeeklyNutrition({
  date,
  targets,
}: {
  date: string;
  targets?: Targets;
}) {
  const summary = nutritionWeek(date, (key) => readFoodDay(key).entries);
  return (
    <div className="space-y-4">
      <p className="text-green-400 font-semibold">
        {summary.days} days with recorded intake
      </p>
      {summary.unavailable.length > 0 && (
        <p role="alert" className="text-amber-300 text-sm">
          {summary.unavailable.length} days could not be read and are excluded.
          Original records are unchanged.
        </p>
      )}
      <dl className="divide-y divide-slate-700">
        {(["calories", "protein", "carbs", "fat"] as const).map((key) => (
          <div key={key} className="py-3">
            <dt className="text-slate-300">
              Average {nutrientLabels[key][0].toLowerCase()}
            </dt>
            <dd className="tabular-nums text-xl text-white font-semibold">
              {summary.averages[key] === null
                ? "No recorded intake"
                : `${Number(summary.averages[key]!.toFixed(1))} ${nutrientLabels[key][1]}`}
            </dd>
            <p className="text-xs text-slate-400 mt-1">
              {targets
                ? `Daily target ${targets[key]} ${nutrientLabels[key][1]}`
                : "No confirmed daily target"}
              {targets && summary.averages[key] !== null && targets[key] > 0
                ? ` · ${Math.round((summary.averages[key]! / targets[key]) * 100)}%`
                : ""}
            </p>
          </div>
        ))}
      </dl>
    </div>
  );
}
