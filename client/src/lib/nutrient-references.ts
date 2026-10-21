import type { Nutrient, Targets } from "./nutrition";

export type NutrientReference = {
  value: number;
  kind: "target" | "intake" | "limit";
  source: "saved-target" | "dri" | "energy";
};
export type ReferenceProfile = { age?: unknown; sex?: unknown };
export type NutrientReferences = Partial<Record<Nutrient, NutrientReference>>;

/** General (non-pregnant/non-lactating) US DRI references. No demographic defaults.
 * Sources and applicability: docs/review/nutrition-details/REFERENCES.md.
 * Existing vitamin A records do not consistently identify IU/µg/RAE: no comparison.
 */
export function nutrientReferences(
  profile: ReferenceProfile,
  targets?: Targets,
): NutrientReferences {
  const refs: NutrientReferences = {};
  const put = (
    key: Nutrient,
    value: unknown,
    kind: NutrientReference["kind"],
    source: NutrientReference["source"],
  ) => {
    if (
      typeof value === "number" &&
      Number.isFinite(value) &&
      value > 0 &&
      value <= 100000
    )
      refs[key] = { value, kind, source };
  };
  for (const key of ["calories", "protein", "carbs", "fat"] as const)
    put(key, targets?.[key], "target", "saved-target");
  const age =
    typeof profile.age === "number" &&
    Number.isInteger(profile.age) &&
    profile.age >= 1 &&
    profile.age <= 120
      ? profile.age
      : null;
  const sex =
    profile.sex === "male" || profile.sex === "female" ? profile.sex : null;
  if (age === null) return refs;
  const bySex = (male: number, female: number) =>
    sex === "male" ? male : sex === "female" ? female : undefined;
  const intake = (key: Nutrient, value: unknown) =>
    put(key, value, "intake", "dri");

  intake(
    "calcium",
    age <= 3
      ? 700
      : age <= 8
        ? 1000
        : age <= 18
          ? 1300
          : age <= 50
            ? 1000
            : age <= 70
              ? bySex(1000, 1200)
              : 1200,
  );
  intake(
    "iron",
    age <= 3
      ? 7
      : age <= 8
        ? 10
        : age <= 13
          ? 8
          : age <= 18
            ? bySex(11, 15)
            : age <= 50
              ? bySex(8, 18)
              : 8,
  );
  intake(
    "potassium",
    age <= 3
      ? 2000
      : age <= 8
        ? 2300
        : age <= 13
          ? bySex(2500, 2300)
          : age <= 18
            ? bySex(3000, 2300)
            : bySex(3400, 2600),
  );
  intake(
    "vitaminC",
    age <= 3
      ? 15
      : age <= 8
        ? 25
        : age <= 13
          ? 45
          : age <= 18
            ? bySex(75, 65)
            : bySex(90, 75),
  );
  put(
    "sodium",
    age <= 3 ? 1200 : age <= 8 ? 1500 : age <= 13 ? 1800 : 2300,
    "limit",
    "dri",
  );

  // Adult fiber energy-density reference: 14 g/1,000 kcal. Without a valid saved
  // calorie target use the sex/age AI table; no activity/weight-based inventions.
  if (age >= 19 && refs.calories)
    put("fiber", (refs.calories.value * 14) / 1000, "intake", "energy");
  else
    intake(
      "fiber",
      age <= 3
        ? 19
        : age <= 8
          ? 25
          : age <= 13
            ? bySex(31, 26)
            : age <= 18
              ? bySex(38, 26)
              : age <= 50
                ? bySex(38, 25)
                : bySex(30, 21),
    );
  // DGA 2020–2025: less than 10% of energy from saturated fat, ages 2+.
  if (age >= 2 && refs.calories)
    put("saturatedFat", (refs.calories.value * 0.1) / 9, "limit", "energy");
  // sugar is TOTAL sugar, not added sugar. Cholesterol has no universal DRI target.
  return refs;
}

export function nutrientProgress(
  actual: number,
  reference: number,
): number | null {
  if (
    !Number.isFinite(actual) ||
    actual < 0 ||
    !Number.isFinite(reference) ||
    reference <= 0
  )
    return null;
  return Math.min(1, actual / reference) * 100;
}
export function formatNutrientAmount(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "Not available";
  if (value > 0 && value < 0.05) return "< 0.1";
  return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
}
