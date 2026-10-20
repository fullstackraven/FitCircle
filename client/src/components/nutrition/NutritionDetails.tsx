import {
  dailyNutrition,
  nutrientFields,
  nutrientLabels,
  type Targets,
} from "@/lib/nutrition";
import type { FoodEntry } from "@/lib/local-food-service";
export function NutritionDetails({
  entries,
  targets,
}: {
  entries: FoodEntry[];
  targets?: Targets;
}) {
  const totals = dailyNutrition(entries);
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">
        Available label data only. Missing values are unknown, not zero. Partial
        totals are lower bounds; no micronutrient recommendations are inferred.
      </p>
      <dl className="divide-y divide-slate-700">
        {nutrientFields.map((key) => {
          const item = totals[key];
          const target =
            targets && key in targets
              ? targets[key as keyof Targets]
              : undefined;
          return (
            <div key={key} className="py-3">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-300">{nutrientLabels[key][0]}</dt>
                <dd className="tabular-nums text-white text-right">
                  {item.known
                    ? `${Number(item.value.toFixed(1))} ${nutrientLabels[key][1]}`
                    : "Not available"}
                </dd>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {item.total === 0
                  ? "No foods logged"
                  : `${item.known} of ${item.total} foods have data${item.known < item.total ? " · incomplete total" : ""}`}
                {target !== undefined &&
                  ` · Target ${target}${nutrientLabels[key][1]}${item.known && target > 0 ? ` · ${Math.round((item.value / target) * 100)}%` : ""}`}
              </p>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
