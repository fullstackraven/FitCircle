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
  const displayedFields = nutrientFields.filter((key) => key !== "vitaminA");
  const empty = entries.length === 0;
  const incomplete = displayedFields.some(
    (key) => totals[key].known < totals[key].total,
  );
  return (
    <div>
      {incomplete && (
        <p id={disclosureId} className="text-xs text-muted-foreground mb-2">
          Some nutrient totals are partial; bars show recorded intake only.
        </p>
      )}
      <dl
        className="divide-y divide-separator/50"
        aria-describedby={incomplete ? disclosureId : undefined}
      >
        {displayedFields.map((key) => {
          const item = totals[key];
          const reference = references[key];
          const label = key === "sugar" ? "Sugar" : nutrientLabels[key][0];
          const unit = nutrientLabels[key][1];
          const usable =
            item.known > 0 && Number.isFinite(item.value) && item.value >= 0;
          const actual = usable
            ? `${formatNutrientAmount(item.value)} ${unit}`
            : empty
              ? "—"
              : "Not available";
          const progress =
            usable && reference
              ? nutrientProgress(item.value, reference.value)
              : null;
          const refText = reference
            ? `${formatNutrientAmount(reference.value)} ${unit}`
            : "";
          return (
            <div
              key={key}
              className="py-3"
              data-testid={`nutrient-${key}`}
              data-complete={item.known === item.total}
            >
              <div className="flex flex-wrap justify-between items-baseline gap-x-3 gap-y-1">
                <dt className="text-supporting min-w-0">{label}</dt>
                <dd
                  className="tabular-nums text-strong text-right text-sm min-w-0 max-w-full [overflow-wrap:anywhere]"
                  aria-label={`${actual}${reference ? `; ${reference.kind === "limit" ? "limit" : reference.kind === "intake" ? "recommended intake" : reference.kind === "reference" ? (reference.source === "app-convention" ? "app tracking reference" : "general label reference") : "saved target"} ${formatNutrientAmount(reference.value)} ${unit}` : ""}${item.known < item.total ? "; partial recorded intake" : ""}`}
                >
                  {usable && reference ? (
                    <>
                      {formatNutrientAmount(item.value)}
                      <span className="text-muted-foreground"> / {refText}</span>
                    </>
                  ) : (
                    <>
                      {actual}
                      {reference && (
                        <span className="text-muted-foreground"> / {refText}</span>
                      )}
                    </>
                  )}
                </dd>
              </div>
              {empty ? (
                <div
                  role="img"
                  aria-label={`${label}: no foods logged`}
                  className="mt-2 h-1 rounded-full bg-nutrition-track"
                />
              ) : (
                progress !== null && (
                  <NutritionProgressBar
                    actual={item.value}
                    target={reference!.value}
                    label={label}
                    description={`${actual}; ${reference!.kind === "limit" ? "limit" : "reference"} ${formatNutrientAmount(reference!.value)} ${unit}${item.known < item.total ? "; partial recorded intake" : ""}`}
                    color={
                      reference!.kind === "limit" ||
                      reference!.kind === "reference"
                        ? "bg-nutrition-blue"
                        : "bg-nutrition-green"
                    }
                  />
                )
              )}
            </div>
          );
        })}
      </dl>
      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground mt-3">No foods logged.</p>
      )}
      <details className="mt-3 text-xs text-muted-foreground">
        <summary className="min-h-11 flex items-center cursor-pointer">
          Reference information
        </summary>
        <p>
          Saved calorie/macronutrient targets; age/sex DRI intakes and sodium
          reduction thresholds. Fiber intake references and saturated-fat limits
          may use saved calories. Limits are not minimum goals. Total sugar is
          not added sugar; its reference is 15% of confirmed daily calories
          divided by 4. This is an app-defined tracking convention, not an RDA
          or FDA Daily Value. Cholesterol uses the FDA label Daily Value of 300
          mg for ages 4+, a general label comparison, not a personalized
          recommended intake or physiological upper limit.
        </p>
        <p className="mt-2">
          General references exclude pregnancy/lactation and smoking
          adjustments. Missing demographics are not inferred.
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
        <p className="mt-2">
          <a
            className="underline"
            href="https://www.fda.gov/food/new-nutrition-facts-label/daily-value-new-nutrition-and-supplement-facts-labels"
            target="_blank"
            rel="noreferrer"
          >
            FDA Daily Values
          </a>
        </p>
      </details>
    </div>
  );
}
