import type { ProductDraft } from "./barcode-lookup";
import type { FoodUnit } from "./local-food-service";
import { nutrientFields } from "./nutrition";

/** Returns only physically known conversions. No inferred density or piece weight. */
export function servingUnitRatio(from: FoodUnit, to: FoodUnit): number | null {
  if (from === to) return 1;
  if (from === "g" && to === "oz") return 1 / 28.349523125;
  if (from === "oz" && to === "g") return 28.349523125;
  return null;
}

/** Rescale from an unchanged anchor, preserving unknown nutrients and confirmed zeros. */
export function rescaleServing(
  anchor: ProductDraft,
  quantity: string,
  unit: FoodUnit,
  equivalent?: string,
): ProductDraft {
  const ratio = servingUnitRatio(anchor.unit, unit);
  // For unrelated units the user supplies the amount of the original unit in one new unit.
  const factor =
    ratio === null
      ? (Number(quantity) * Number(equivalent)) / Number(anchor.quantity)
      : Number(quantity) / (Number(anchor.quantity) * ratio);
  if (!Number.isFinite(factor) || factor <= 0)
    throw new Error(
      "Enter a positive serving quantity and, when needed, its equivalent amount.",
    );
  return {
    ...anchor,
    quantity,
    unit,
    values: Object.fromEntries(
      nutrientFields.map((key) => [
        key,
        anchor.values[key].trim() === ""
          ? ""
          : String(
              Number((Number(anchor.values[key]) * factor).toPrecision(12)),
            ),
      ]),
    ) as ProductDraft["values"],
  };
}
