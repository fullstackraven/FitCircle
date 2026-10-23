import { nutrientProgress } from "@/lib/nutrient-references";

/** Shared thin, clamped bar; the numerical intake remains uncapped. */
export function NutritionProgressBar({
  actual,
  target,
  label,
  description,
  color = "bg-nutrition-green",
}: {
  actual: number;
  target: number;
  label: string;
  description: string;
  color?: string;
}) {
  const progress = nutrientProgress(actual, target);
  if (progress === null) return null;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Number(progress.toFixed(1))}
      aria-valuetext={description}
      className="mt-2 h-1 rounded-full bg-nutrition-track overflow-hidden"
    >
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
