import { useState } from "react";
import { PlusCircle, ChevronDown, Trash2 } from "lucide-react";
import type { FoodEntry } from "@/lib/local-food-service";
import { dailyNutrition, servingsOf } from "@/lib/nutrition";
type Meal = FoodEntry["meal"];
export function MealDiary({
  entries,
  onAdd,
  onEdit,
  onDelete,
  disabled,
}: {
  entries: FoodEntry[];
  onAdd: (meal: Meal) => void;
  onEdit: (entry: FoodEntry) => void;
  onDelete: (id: string) => void;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = useState<Partial<Record<Meal, boolean>>>({});
  return (
    <div className="space-y-3">
      {(["breakfast", "lunch", "dinner", "snack"] as const).map((meal) => {
        const foods = entries.filter((entry) => entry.meal === meal);
        const label =
          meal === "snack" ? "Snacks" : meal[0].toUpperCase() + meal.slice(1);
        const calories = Math.round(dailyNutrition(foods).calories.value);
        return (
          <section key={meal} className="rounded-2xl bg-slate-800 p-3">
            <div className="flex gap-2 items-center">
              <button
                aria-label={`${label} ${calories} cal`}
                aria-expanded={!!expanded[meal]}
                aria-controls={`meal-${meal}`}
                className="flex-1 flex items-center justify-between text-left min-h-14 gap-2"
                onClick={() =>
                  setExpanded({ ...expanded, [meal]: !expanded[meal] })
                }
              >
                <span>
                  <span className="font-semibold text-white block">
                    {label}
                  </span>
                  <span className="text-xs text-slate-400">
                    {foods.length
                      ? `${foods.length} ${foods.length === 1 ? "food" : "foods"}`
                      : "No foods logged"}
                  </span>
                </span>
                <span className="flex items-center gap-2 text-slate-400 text-sm tabular-nums">
                  {calories} cal
                  <ChevronDown
                    size={16}
                    className={expanded[meal] ? "rotate-180" : ""}
                  />
                </span>
              </button>
              <button
                disabled={disabled}
                onClick={() => onAdd(meal)}
                aria-label={`Add Food to ${label}`}
                data-testid={`button-add-${meal}`}
                className="min-w-11 min-h-11 flex items-center justify-center text-green-400 disabled:opacity-40"
              >
                <PlusCircle size={22} />
              </button>
            </div>
            {expanded[meal] && (
              <div
                id={`meal-${meal}`}
                className="divide-y divide-slate-700 mt-2"
              >
                {foods.length ? (
                  foods.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex gap-2 py-3"
                      data-testid={`food-item-${entry.id}`}
                    >
                      <button
                        disabled={disabled}
                        onClick={() => onEdit(entry)}
                        className="flex-1 text-left min-w-0"
                      >
                        <span className="block font-medium text-white break-words">
                          {entry.name}
                        </span>
                        {entry.brand && (
                          <span className="block text-xs text-slate-400">
                            {entry.brand}
                          </span>
                        )}
                        <span className="block text-xs text-slate-400 mt-1">
                          {Number(
                            ((entry.quantity ?? 1) * servingsOf(entry)).toFixed(
                              2,
                            ),
                          )}{" "}
                          {entry.unit ?? "serving"} ·{" "}
                          {Math.round(entry.calories * servingsOf(entry))} kcal
                        </span>
                        <span className="block text-xs text-slate-300 mt-1 tabular-nums">
                          P{" "}
                          {Number(
                            (entry.protein * servingsOf(entry)).toFixed(1),
                          )}
                          g · C{" "}
                          {Number((entry.carbs * servingsOf(entry)).toFixed(1))}
                          g · F{" "}
                          {Number((entry.fat * servingsOf(entry)).toFixed(1))}g
                        </span>
                      </button>
                      <button
                        disabled={disabled}
                        aria-label={`Delete ${entry.name}`}
                        onClick={() => onDelete(entry.id)}
                        data-testid={`button-delete-${entry.id}`}
                        className="min-w-11 min-h-11 self-center flex items-center justify-center text-slate-400 hover:text-red-400"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 py-2">No foods logged</p>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
