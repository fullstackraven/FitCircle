import { useId } from "react";
import { nutritionWeek, nutrientLabels, type Targets } from "@/lib/nutrition";
import { readFoodDay } from "@/lib/food-diary";
import { formatNutrientAmount } from "@/lib/nutrient-references";
import { getDateString, parseLocalDate } from "@/lib/date-utils";
import { NutritionProgressBar } from "./NutritionProgressBar";

const colors = {
  calories: "bg-green-400",
  protein: "bg-green-400",
  carbs: "bg-blue-400",
  fat: "bg-yellow-400",
};
export function WeeklyNutrition({
  date,
  targets,
}: {
  date: string;
  targets?: Targets;
}) {
  const summary = nutritionWeek(date, (key) => readFoodDay(key).entries);
  const disclosureId = useId();
  const keys = ["calories", "protein", "carbs", "fat"] as const;
  const incomplete = keys.some(
    (key) => summary.totals[key].known < summary.totals[key].total,
  );
  const today = getDateString(new Date());
  const thisWeek =
    today >= summary.calendarDays[0].date &&
    today <= summary.calendarDays[6].date;
  const shortDate = (key: string) =>
    parseLocalDate(key).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-400 mb-2">
          {thisWeek
            ? "This week"
            : `${shortDate(summary.calendarDays[0].date)} – ${shortDate(summary.calendarDays[6].date)}`}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-white font-semibold tabular-nums">
            {summary.days} of 7 days logged
          </p>
          <ol
            aria-label="Sunday through Saturday logging"
            className="flex gap-2"
          >
            {summary.calendarDays.map((day) => (
              <li
                key={day.date}
                data-testid={`weekly-day-${day.date}`}
                data-status={day.status}
                aria-label={`${parseLocalDate(day.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}: ${day.status === "unavailable" ? "data unavailable" : day.status}`}
                className={`h-2.5 w-2.5 rounded-full ${day.status === "logged" ? "bg-green-400" : "bg-slate-700"} ${day.status === "unavailable" ? "ring-1 ring-slate-400" : ""}`}
              />
            ))}
          </ol>
        </div>
      </div>
      {summary.unavailable.length > 0 && (
        <p className="text-xs text-slate-400" role="status">
          {summary.unavailable.length}{" "}
          {summary.unavailable.length === 1 ? "day" : "days"} unavailable;
          excluded from averages. Original records are unchanged.
        </p>
      )}
      {incomplete && (
        <p id={disclosureId} className="text-xs text-slate-400">
          Some nutrient totals are partial; bars show recorded intake only.
        </p>
      )}
      {summary.days === 0 ? (
        <p className="text-sm text-slate-300 py-3">
          No recorded intake this week.
        </p>
      ) : (
        <dl
          className="space-y-5"
          aria-describedby={incomplete ? disclosureId : undefined}
        >
          {keys.map((key) => {
            const average = summary.averages[key];
            const rawTarget = targets?.[key];
            const target =
              typeof rawTarget === "number" &&
              Number.isFinite(rawTarget) &&
              rawTarget > 0
                ? rawTarget
                : null;
            const label = nutrientLabels[key][0];
            const unit = nutrientLabels[key][1];
            const actual =
              average === null
                ? "Not available"
                : formatNutrientAmount(average);
            const partial =
              summary.totals[key].known < summary.totals[key].total;
            const description = `${actual}${average === null ? "" : ` ${unit}`} average${target === null ? "" : `; saved target ${formatNutrientAmount(target)} ${unit}`}${partial ? "; partial recorded intake" : ""}`;
            return (
              <div key={key} data-testid={`weekly-${key}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <dt className="text-slate-300 min-w-0">{label}</dt>
                  <dd
                    aria-label={description}
                    className="tabular-nums text-white text-right text-sm min-w-0 max-w-full [overflow-wrap:anywhere]"
                  >
                    {actual}
                    <span className="text-slate-400">
                      {target === null
                        ? average === null
                          ? ""
                          : ` ${unit}`
                        : ` / ${formatNutrientAmount(target)} ${unit}`}
                    </span>
                  </dd>
                </div>
                {average !== null && target !== null && (
                  <NutritionProgressBar
                    actual={average}
                    target={target}
                    label={label}
                    description={description}
                    color={colors[key]}
                  />
                )}
              </div>
            );
          })}
        </dl>
      )}
      <p className="text-xs text-slate-400">
        Daily averages for logged days only
      </p>
    </div>
  );
}
