import type { LocalFoodItem, FoodUnit } from "./local-food-service";
import { normalizeBarcode, barcodeIdentity } from "./barcode";
import { nutrientFields, type Nutrient } from "./nutrition";
export type ProductDraft = {
  name: string;
  brand: string;
  barcode: string;
  quantity: string;
  unit: FoodUnit;
  values: Record<Nutrient, string>;
  source?: string;
  sourceUrl?: string;
  warnings: string[];
};
const plain = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);
const amount = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : typeof value === "string" &&
        value.trim() !== "" &&
        Number.isFinite(Number(value)) &&
        Number(value) >= 0
      ? Number(value)
      : undefined;
export function draftFromFood(food: LocalFoodItem): ProductDraft {
  return {
    name: food.name,
    brand: food.brand ?? "",
    barcode: food.barcode ?? "",
    quantity: String(food.quantity),
    unit: food.unit,
    values: Object.fromEntries(
      nutrientFields.map((key) => [
        key,
        food[key] === undefined ? "" : String(food[key]),
      ]),
    ) as Record<Nutrient, string>,
    warnings: [],
    source: (food as LocalFoodItem & { source?: string }).source,
    sourceUrl: (food as LocalFoodItem & { sourceUrl?: string }).sourceUrl,
  };
}
/** Select one explicit basis; never combine per-serving and per-100g values. */
function canonicalProduct(product: Record<string, unknown>) {
  if (!plain(product.nutrition)) return { product, warnings: [] as string[] };
  const nutrition = product.nutrition;
  const inputs = Array.isArray(nutrition.input_sets)
    ? nutrition.input_sets.filter(plain)
    : [];
  const aggregate = plain(nutrition.aggregated_set)
    ? nutrition.aggregated_set
    : null;
  const selected =
    aggregate ??
    inputs.find(
      (set) =>
        set.preparation === "as_sold" &&
        ["packaging", "manufacturer"].includes(String(set.source)),
    ) ??
    inputs[0];
  if (!selected || !plain(selected.nutrients))
    return {
      product: { ...product, nutriments: {} },
      warnings: [
        "No usable nutrition set was supplied. Enter the package values.",
      ],
    };
  const warnings: string[] = [];
  if (selected.preparation === "prepared")
    warnings.push(
      "These values describe the prepared product, not necessarily the product as sold. Check the package instructions.",
    );
  const per = selected.per;
  if (!["100g", "100ml", "serving"].includes(String(per)))
    return {
      product: { ...product, nutriments: {} },
      warnings: [
        "The nutrition basis is unknown. Enter a verified serving and label values.",
      ],
    };
  const suffix = per === "serving" ? "serving" : "100g";
  const nutriments: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(selected.nutrients)) {
    if (!plain(value)) continue;
    // A supplied numeric value is required. Do not treat unspecified or null as zero.
    const numeric = amount(value.value);
    if (numeric === undefined) continue;
    const unit = String(value.unit ?? "");
    if (value.source === "estimate" || value.modifier === "~")
      warnings.push(
        "Some returned values are estimates. Verify them against the package before logging.",
      );
    if (["<", ">", "≤", "≥", "<=", ">="].includes(String(value.modifier)))
      continue;
    if (
      (key === "energy-kcal" && unit === "kcal") ||
      (key === "energy-kj" && unit === "kJ")
    ) {
      nutriments[`${key}_${suffix}`] = numeric;
      continue;
    }
    if (key === "energy" && unit === "kJ") {
      nutriments[`energy-kj_${suffix}`] = numeric;
      continue;
    }
    const toGrams =
      unit === "g"
        ? 1
        : unit === "mg"
          ? 0.001
          : ["µg", "μg", "ug", "mcg"].includes(unit)
            ? 0.000001
            : undefined;
    if (toGrams === undefined) continue;
    nutriments[`${key}_${suffix}`] = numeric * toGrams;
    nutriments[`${key}_unit`] = "g";
  }
  const perQuantity = amount(selected.per_quantity);
  const perUnit = selected.per_unit;
  const serving =
    per === "100ml"
      ? "100 ml"
      : per === "100g"
        ? "100 g"
        : perQuantity && ["g", "ml"].includes(String(perUnit))
          ? `${perQuantity} ${perUnit}`
          : "";
  return {
    product: { ...product, nutriments, serving_size: serving },
    warnings: [...new Set(warnings)],
  };
}

/** OFF returns grams for macronutrients and mineral/vitamin base units. No missing value becomes zero. */
export function normalizeOpenFoodFacts(
  input: unknown,
  barcode: string,
): ProductDraft {
  if (
    !plain(input) ||
    ![1, "success", "success_with_warnings"].includes(
      input.status as string | number,
    ) ||
    !plain(input.product)
  )
    throw new Error(
      "Product not found. Try Search Foods or Create Custom Food.",
    );
  const canonical = canonicalProduct(input.product);
  const product = canonical.product;
  if (
    typeof product.code === "string" &&
    barcodeIdentity(product.code) !== barcodeIdentity(barcode)
  )
    throw new Error("The returned product barcode does not match.");
  const nutriments = plain(product.nutriments) ? product.nutriments : {};
  const servingGrams =
    typeof product.serving_size === "string"
      ? product.serving_size.match(/(?:^|[\s(])(\d+(?:\.\d+)?)\s*(g|ml)\b/i)
      : null;
  const grams = servingGrams ? Number(servingGrams[1]) : undefined;
  const has100 = Object.keys(nutriments).some(
    (key) => key.endsWith("_100g") && amount(nutriments[key]) !== undefined,
  );
  const basis = has100 ? "100g" : "serving";
  const fields: Record<Nutrient, string> = {
    calories: "energy-kcal",
    protein: "proteins",
    carbs: "carbohydrates",
    fat: "fat",
    fiber: "fiber",
    sugar: "sugars",
    sodium: "sodium",
    saturatedFat: "saturated-fat",
    cholesterol: "cholesterol",
    potassium: "potassium",
    calcium: "calcium",
    iron: "iron",
    vitaminA: "vitamin-a",
    vitaminC: "vitamin-c",
  };
  const values = {} as Record<Nutrient, string>;
  const warnings: string[] = [...canonical.warnings];
  for (const key of nutrientFields) {
    const name = fields[key];
    let value = amount(nutriments[`${name}_${basis}`]);
    if (key === "calories" && value === undefined) {
      const kj = amount(nutriments[`energy-kj_${basis}`]);
      if (kj !== undefined) value = kj / 4.184;
    }
    if (key === "sodium" && value === undefined) {
      const salt = amount(nutriments[`salt_${basis}`]);
      const unit = nutriments.salt_unit ?? "g";
      if (salt !== undefined && (unit === "g" || unit === "mg"))
        value = salt * 400;
    } else if (
      value !== undefined &&
      [
        "sodium",
        "cholesterol",
        "potassium",
        "calcium",
        "iron",
        "vitaminA",
        "vitaminC",
      ].includes(key)
    ) {
      // OFF *_100g and *_serving values are normalized to base grams,
      // even when *_unit describes a package label entered in mg or µg.
      const unit = nutriments[`${name}_unit`] ?? "g";
      if (!["g", "mg", "µg", "μg", "ug", "mcg"].includes(String(unit))) {
        value = undefined;
        warnings.push(`${key}: unrecognized unit; check the package label.`);
      } else value *= key === "vitaminA" ? 1_000_000 : 1000;
      // IU cannot be converted to RAE without knowing the form; leave it unknown.
    }
    if (
      ["<", ">", "≤", "≥", "<=", ">="].includes(
        String(nutriments[`${name}_modifier`]),
      )
    )
      value = undefined;
    values[key] = value === undefined ? "" : String(Number(value.toFixed(4)));
  }
  if (!has100 && Object.values(values).every((v) => v === ""))
    warnings.push(
      "No usable nutrition values were returned. Enter the package label values before continuing.",
    );
  if (!has100)
    warnings.push(
      "Values are per product serving. Its weight is not assumed; confirm the serving on the package.",
    );
  if (nutrientFields.some((key) => values[key] === ""))
    warnings.push(
      "Some nutrients are missing. Blank fields remain unknown. Calories and macros must be supplied before logging.",
    );
  return {
    name: typeof product.product_name === "string" ? product.product_name : "",
    brand: typeof product.brands === "string" ? product.brands : "",
    barcode: normalizeBarcode(barcode),
    quantity: has100 ? "100" : grams && grams > 0 ? String(grams) : "1",
    unit:
      has100 || (grams && grams > 0)
        ? servingGrams?.[2].toLowerCase() === "ml"
          ? "ml"
          : "g"
        : "serving",
    values,
    source: "Open Food Facts",
    sourceUrl: `https://world.openfoodfacts.org/product/${normalizeBarcode(barcode)}`,
    warnings,
  };
}
let lastExternalLookup = 0;
export async function lookupBarcode(
  value: string,
  local: (code: string) => Promise<LocalFoodItem | null>,
  options: {
    online?: boolean;
    signal?: AbortSignal;
    fetcher?: typeof fetch;
  } = {},
) {
  const barcode = normalizeBarcode(value);
  const saved = await local(barcode);
  if (saved) return { local: saved, draft: draftFromFood(saved) };
  if (options.online === false)
    throw new Error(
      "This product is not saved locally. Connect to look it up, or create a custom food from its label.",
    );
  const now = Date.now();
  if (now - lastExternalLookup < 4100)
    throw new Error("Please wait a few seconds before another product lookup.");
  lastExternalLookup = now;
  const response = await (options.fetcher ?? fetch)(
    `https://world.openfoodfacts.org/api/v3/product/${barcode}?fields=code,product_name,brands,serving_size,nutrition,nutriments&app_name=FitCircle&app_version=2.0&user_agent=${encodeURIComponent("FitCircle/2.0 (https://github.com/fullstackraven/FitCircle)")}`,
    {
      signal: options.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
    },
  );
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? "Product lookup is rate limited. Wait before trying again."
        : "Product lookup is unavailable. Try again later or enter the label manually.",
    );
  return {
    local: null,
    draft: normalizeOpenFoodFacts(await response.json(), barcode),
  };
}
