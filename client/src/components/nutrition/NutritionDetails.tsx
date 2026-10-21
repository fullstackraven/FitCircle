import { NutritionProgressBar } from "./NutritionProgressBar";
import { useId } from "react";
import {
  dailyNutrition,
  nutrientFields,
  nutrientLabels,
  type Targets,
} from "@/lib/nutrition";
import { readFitnessProfile } from "@/lib/fitness-profile";
import {
  nutrientReferences,
  nutrientProgress,
  formatNutrientAmount,
} from "@/lib/nutrient-references";
import type { FoodEntry } from "@/lib/local-food-service";

export function NutritionDetails({
  entries,
  targets,
}: {
  entries: FoodEntry[];
  targets?: Targets;
}) {
  const totals = dailyNutrition(entries);
  const profile = readFitnessProfile();
  const references = nutrientReferences(
    { age: profile.age, sex: profile.record.gender },
    targets,
  );
  const disclosureId = useId();
  const incomplete = nutrientFields.some(
    (key) => totals[key].known < totals[key].total,
  );
  // Custom/legacy vitamin A was labelled IU, scanned products use µg. A numeric
  // field alone cannot establish a shared unit or a retinol activity equivalent.
  const vitaminAUnitKnown = entries
    .filter((entry) => typeof entry.vitaminA === "number")
    .every((entry) => "source" in entry && entry.source === "Open Food Facts");
  return (
    <div>
      {incomplete && (
        <p id={disclosureId} className="text-xs text-slate-400 mb-2">
          Some nutrient totals are partial; bars show recorded intake only.
        </p>
      )}
      <dl
        className="divide-y divide-slate-700/50"
        aria-describedby={incomplete ? disclosureId : undefined}
      >
        {nutrientFields.map((key) => {
          const item = totals[key];
          const reference = references[key];
          const label =
            key === "sugar" ? "Total sugar" : nutrientLabels[key][0];
          const unit = nutrientLabels[key][1];
          const usable =
            item.known > 0 &&
            Number.isFinite(item.value) &&
            item.value >= 0 &&
            (key !== "vitaminA" || vitaminAUnitKnown);
          const actual = usable
            ? `${formatNutrientAmount(item.value)} ${unit}`
            : key === "vitaminA" && item.known > 0 && !vitaminAUnitKnown
              ? "Unit unavailable"
              : "Not available";
          const progress =
            usable && reference
              ? nutrientProgress(item.value, reference.value)
              : null;
          const refText = reference
            ? `${formatNutrientAmount(reference.value)} ${unit}${reference.kind === "limit" ? " limit" : ""}`
            : "";
          return (
            <div
              key={key}
              className="py-3"
              data-testid={`nutrient-${key}`}
              data-complete={item.known === item.total}
            >
              <div className="flex flex-wrap justify-between items-baseline gap-x-3 gap-y-1">
                <dt className="text-slate-300 min-w-0">{label}</dt>
                <dd
                  className="tabular-nums text-white text-right text-sm min-w-0 max-w-full [overflow-wrap:anywhere]"
                  aria-label={`${actual}${reference ? `; ${reference.kind === "limit" ? "limit" : reference.kind === "intake" ? "recommended intake" : "saved target"} ${formatNutrientAmount(reference.value)} ${unit}` : ""}${item.known < item.total ? "; partial recorded intake" : ""}`}
                >
                  {usable && reference ? (
                    <>
                      {formatNutrientAmount(item.value)}
                      <span className="text-slate-400"> / {refText}</span>
                    </>
                  ) : (
                    <>
                      {actual}
                      {reference && (
                        <span className="text-slate-400"> / {refText}</span>
                      )}
                    </>
                  )}
                </dd>
              </div>
              {progress !== null && (
                <NutritionProgressBar
                  actual={item.value}
                  target={reference!.value}
                  label={label}
                  description={`${actual}; ${reference!.kind === "limit" ? "limit" : "reference"} ${formatNutrientAmount(reference!.value)} ${unit}${item.known < item.total ? "; partial recorded intake" : ""}`}
                  color={
                    reference!.kind === "limit" ? "bg-blue-400" : "bg-green-400"
                  }
                />
              )}
            </div>
          );
        })}
      </dl>
      {entries.length === 0 && (
        <p className="text-xs text-slate-400 mt-3">No foods logged.</p>
      )}
      <details className="mt-3 text-xs text-slate-400">
        <summary className="min-h-11 flex items-center cursor-pointer">
          Reference information
        </summary>
        <p>
          Saved calorie/macronutrient targets; age/sex DRI intakes and sodium
          reduction thresholds. Fiber intake references and saturated-fat limits
          may use saved calories. Limits are not minimum goals. Total sugar and
          cholesterol have no universal target.
        </p>
        <p className="mt-2">
          General references exclude pregnancy/lactation and smoking
          adjustments. Missing demographics are not inferred. Vitamin A has no
          comparison because legacy IU and µg/RAE are not interchangeable;
          ambiguous totals are withheld.
        </p>
        <p className="mt-2">
          <a
            className="underline"
            href="https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx"
            target="_blank"
            rel="noreferrer"
          >
            NIH / National Academies DRI tables
          </a>{" "}
          ·{" "}
          <a
            className="underline"
            href="https://www.dietaryguidelines.gov/sites/default/files/2020-12/Dietary_Guidelines_for_Americans_2020-2025.pdf"
            target="_blank"
            rel="noreferrer"
          >
            DGA 2020–2025
          </a>
        </p>
      </details>
    </div>
  );
}
