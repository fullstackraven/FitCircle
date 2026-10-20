import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  nutrientFields,
  nutrientLabels,
  consumedServingText,
} from "@/lib/nutrition";
import { foodDataSchema } from "@/lib/backup";
import {
  localFoodService,
  type LocalFoodItem,
  type FoodUnit,
  type FoodEntry,
} from "@/lib/local-food-service";
import { rescaleServing, servingUnitRatio } from "@/lib/food-serving";
import type { ProductDraft } from "@/lib/barcode-lookup";

type Meal = FoodEntry["meal"];
export function FoodEntryForm({
  initial,
  local,
  scanned,
  initialMeal,
  saveError,
  onAdd,
  onCancel,
}: {
  initial: ProductDraft;
  local: LocalFoodItem | null;
  scanned: boolean;
  initialMeal: Meal;
  saveError: string | null;
  onAdd: (food: LocalFoodItem, servings: number, meal: Meal) => boolean;
  onCancel: () => void;
}) {
  const [anchor, setAnchor] = useState(initial);
  const [quantity, setQuantity] = useState(initial.quantity);
  const [unit, setUnit] = useState(initial.unit);
  const [equivalent, setEquivalent] = useState("");
  const [servings, setServings] = useState("1");
  const [meal, setMeal] = useState(initialMeal);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const saved = useRef<LocalFoodItem | null>(null);
  const needsEquivalent = servingUnitRatio(anchor.unit, unit) === null;
  let draft = { ...anchor, quantity, unit };
  let scalingError = "";
  try {
    draft = rescaleServing(anchor, quantity, unit, equivalent);
  } catch (failure) {
    scalingError = (failure as Error).message;
  }
  const missingCore = nutrientFields
    .slice(0, 4)
    .some((key) => draft.values[key] === "");
  const add = async () => {
    setError("");
    setBusy(true);
    try {
      if (scalingError) throw new Error(scalingError);
      if (missingCore)
        throw new Error(
          "Calories, protein, carbohydrates and fat are required. Check the label and enter confirmed zeros explicitly.",
        );
      if (!Number.isFinite(Number(servings)) || Number(servings) <= 0)
        throw new Error("Enter a positive serving count.");
      const nutrients = Object.fromEntries(
        nutrientFields
          .filter((key) => draft.values[key].trim() !== "")
          .map((key) => [key, Number(draft.values[key])]),
      );
      const food = {
        ...local,
        id: local?.id ?? `scan-${crypto.randomUUID()}`,
        name: draft.name.trim(),
        brand: draft.brand.trim() || undefined,
        barcode: draft.barcode || undefined,
        quantity: Number(quantity),
        unit,
        ...nutrients,
        source: draft.source,
        sourceUrl: draft.sourceUrl,
      };
      delete (food as Partial<LocalFoodItem>).nutritionPer100g;
      for (const key of nutrientFields)
        if (!(key in nutrients)) delete (food as Partial<LocalFoodItem>)[key];
      if (!foodDataSchema.safeParse(food).success)
        throw new Error(
          "Enter a food name, positive serving quantity and valid nonnegative nutrition values.",
        );
      // Automatically cache new scanned products. Never replace a customized or historical product.
      // Cache once: a failed diary write can be retried without duplicate catalog writes.
      if (scanned && !local && !saved.current) {
        const existing = await localFoodService.getProductByBarcode(
          draft.barcode,
        );
        saved.current =
          existing ??
          (await localFoodService.saveReviewedProduct(food as LocalFoodItem));
      }
      onAdd(food as LocalFoodItem, Number(servings), meal);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not save this food. Your existing records are unchanged.",
      );
    } finally {
      setBusy(false);
    }
  };
  const editNutrient = (
    key: (typeof nutrientFields)[number],
    value: string,
  ) => {
    if (scalingError) return;
    setAnchor({ ...draft, values: { ...draft.values, [key]: value } });
    setEquivalent("");
  };
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-xl font-semibold text-white">
          {draft.name || "Scanned food"}
        </h3>
        {draft.brand && <p className="text-sm text-slate-400">{draft.brand}</p>}
      </div>
      {initial.warnings.map((warning) => (
        <p key={warning} className="text-xs text-amber-200">
          {warning}
        </p>
      ))}
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-slate-300">
          Base serving quantity
          <Input
            aria-label="Product serving quantity"
            type="number"
            min="0"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>
        <label className="text-sm text-slate-300">
          Base serving unit
          <select
            aria-label="Product serving unit"
            className="w-full min-h-10 bg-slate-800 rounded-lg px-2"
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value as FoodUnit);
              setEquivalent("");
            }}
          >
            {["g", "oz", "ml", "cup", "piece", "serving", "slice"].map(
              (value) => (
                <option key={value}>{value}</option>
              ),
            )}
          </select>
        </label>
      </div>
      {needsEquivalent && (
        <label className="block text-sm text-slate-300">
          One {unit} equals how many {anchor.unit}?
          <Input
            aria-label="Equivalent original quantity"
            type="number"
            min="0"
            step="any"
            value={equivalent}
            onChange={(e) => setEquivalent(e.target.value)}
          />
          <span className="text-xs text-slate-400">
            Check the label or weigh the serving. Weight, volume and pieces
            cannot be converted without this information.
          </span>
        </label>
      )}
      <p className="text-xs text-slate-400">
        Base serving edits rescale nutrition. Servings eaten multiplies the
        result. Earlier logs and saved foods stay unchanged.
      </p>
      <label className="block text-sm text-slate-300">
        Servings eaten (multiplier)
        <Input
          data-testid="input-add-servings"
          type="number"
          step="any"
          min="0"
          value={servings}
          onChange={(e) => setServings(e.target.value)}
        />
      </label>
      <p className="text-sm tabular-nums text-green-400">
        {consumedServingText(Number(quantity), unit, servings)}
      </p>
      <label className="block text-sm text-slate-300">
        Meal
        <Select value={meal} onValueChange={(value) => setMeal(value as Meal)}>
          <SelectTrigger aria-label="Meal" className="bg-slate-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["breakfast", "lunch", "dinner", "snack"] as const).map(
              (value) => (
                <SelectItem key={value} value={value}>
                  {value[0].toUpperCase() + value.slice(1)}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </label>
      <div
        className="grid grid-cols-4 gap-2 rounded-xl bg-slate-800 p-4 text-center tabular-nums"
        data-testid="entry-nutrition-summary"
      >
        {(["calories", "carbs", "fat", "protein"] as const).map((key) => (
          <div key={key}>
            <strong
              className={`text-lg ${key === "protein" ? "text-green-400" : key === "carbs" ? "text-blue-400" : key === "fat" ? "text-rose-400" : "text-white"}`}
            >
              {scalingError ||
              draft.values[key] === "" ||
              !Number.isFinite(Number(servings)) ||
              Number(servings) <= 0
                ? "Unknown"
                : Number(
                    (Number(draft.values[key]) * Number(servings)).toPrecision(
                      4,
                    ),
                  )}
              {key !== "calories" &&
              draft.values[key] !== "" &&
              !scalingError &&
              Number.isFinite(Number(servings)) &&
              Number(servings) > 0
                ? "g"
                : ""}
            </strong>
            <div className="text-xs text-slate-400">
              {key === "calories" ? "cal" : nutrientLabels[key][0]}
            </div>
          </div>
        ))}
      </div>
      <details
        open={missingCore || undefined}
        className="rounded-xl bg-slate-800 p-3"
      >
        <summary className="text-sm text-green-400 cursor-pointer">
          Edit label nutrition
        </summary>
        <p className="text-xs text-slate-400 my-2">
          Values per {quantity} {unit}. Blank means unknown; enter zero only
          when confirmed.
        </p>
        <label className="block text-sm">
          Food name
          <Input
            aria-label="Product name"
            value={anchor.name}
            onChange={(e) => setAnchor({ ...anchor, name: e.target.value })}
          />
        </label>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {nutrientFields.map((key) => (
            <label key={key} className="text-sm text-slate-300">
              {nutrientLabels[key][0]} ({nutrientLabels[key][1]})
              <Input
                aria-label={`Product ${nutrientLabels[key][0]}`}
                type="number"
                min="0"
                step="any"
                disabled={!!scalingError}
                value={draft.values[key]}
                onChange={(e) => editNutrient(key, e.target.value)}
              />
            </label>
          ))}
        </div>
      </details>
      {scanned && (
        <p className="text-xs text-slate-400">
          Automatically saved offline when added. Existing foods stay unchanged.
        </p>
      )}
      {draft.source === "Open Food Facts" && (
        <p className="text-xs text-slate-400">
          Product data:{" "}
          <a
            className="text-green-400 underline"
            target="_blank"
            rel="noreferrer"
            href={draft.sourceUrl ?? "https://world.openfoodfacts.org"}
          >
            Open Food Facts
          </a>{" "}
          ·{" "}
          <a
            className="underline"
            href="https://opendatacommons.org/licenses/odbl/1-0/"
            target="_blank"
            rel="noreferrer"
          >
            ODbL
          </a>
          . Verify community data against the package.
        </p>
      )}
      {(error || saveError || scalingError) && (
        <p role="alert" className="text-sm text-red-400">
          {error || saveError || scalingError}
          {saved.current && saveError
            ? " Product is saved offline; the diary entry has not been saved."
            : ""}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          data-testid="button-save-add-entry"
          disabled={busy}
          className="bg-green-400 text-slate-950"
          onClick={() => void add()}
        >
          {busy ? "Saving…" : "Add"}
        </Button>
      </div>
    </div>
  );
}
