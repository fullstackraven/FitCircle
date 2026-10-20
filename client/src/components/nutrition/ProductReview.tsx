import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { nutrientFields, nutrientLabels } from "@/lib/nutrition";
import { foodDataSchema } from "@/lib/backup";
import {
  localFoodService,
  type LocalFoodItem,
  type FoodUnit,
} from "@/lib/local-food-service";
import type { ProductDraft } from "@/lib/barcode-lookup";
export function ProductReview({
  initial,
  local,
  onReviewed,
  onBack,
}: {
  initial: ProductDraft;
  local: LocalFoodItem | null;
  onReviewed: (food: LocalFoodItem) => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [saveLocal, setSaveLocal] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setError("");
    setBusy(true);
    try {
      if (
        ["calories", "protein", "carbs", "fat"].some(
          (key) => draft.values[key as keyof typeof draft.values].trim() === "",
        )
      )
        throw new Error(
          "Calories, protein, carbohydrates and fat are required. Check the label and enter confirmed zeros explicitly.",
        );
      const nutrients = Object.fromEntries(
        nutrientFields
          .filter((key) => draft.values[key].trim() !== "")
          .map((key) => [key, Number(draft.values[key])]),
      );
      if (
        Object.values(nutrients).some(
          (value) => !Number.isFinite(value) || value < 0,
        )
      )
        throw new Error(
          "Nutrition values must be finite, nonnegative numbers. Leave unknown optional values blank.",
        );
      const retained: Partial<LocalFoodItem> = { ...local };
      for (const key of nutrientFields) delete retained[key];
      const food = {
        ...retained,
        id: local?.id ?? `scan-${crypto.randomUUID()}`,
        name: draft.name.trim(),
        brand: draft.brand.trim() || undefined,
        barcode: draft.barcode,
        quantity: Number(draft.quantity),
        unit: draft.unit,
        ...nutrients,
        source: draft.source,
        sourceUrl: draft.sourceUrl,
      };
      // Values in this review are per displayed serving, not inferred per-100g data.
      delete (food as Partial<LocalFoodItem>).nutritionPer100g;
      if (!foodDataSchema.safeParse(food).success)
        throw new Error(
          "Enter a food name, positive serving quantity and valid nutrition values.",
        );
      const reviewed = food as LocalFoodItem;
      onReviewed(
        saveLocal
          ? await localFoodService.saveReviewedProduct(reviewed)
          : reviewed,
      );
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not save. Your existing foods are unchanged.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white">Review Product</h3>
        <p className="text-xs text-slate-400">
          Barcode {draft.barcode} ·{" "}
          {local ? "Saved local food" : "Label review required"}
        </p>
      </div>
      {initial.warnings.map((warning) => (
        <p key={warning} className="text-xs text-amber-200">
          {warning}
        </p>
      ))}
      <label className="block text-sm text-slate-300">
        Food name
        <Input
          aria-label="Product name"
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
      </label>
      <label className="block text-sm text-slate-300">
        Brand
        <Input
          aria-label="Product brand"
          value={draft.brand}
          onChange={(event) =>
            setDraft({ ...draft, brand: event.target.value })
          }
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-slate-300">
          Serving quantity
          <Input
            aria-label="Product serving quantity"
            type="number"
            step="any"
            value={draft.quantity}
            onChange={(event) =>
              setDraft({ ...draft, quantity: event.target.value })
            }
          />
        </label>
        <label className="text-sm text-slate-300">
          Unit
          <select
            aria-label="Product serving unit"
            className="w-full min-h-10 bg-slate-800 rounded-lg"
            value={draft.unit}
            onChange={(event) =>
              setDraft({ ...draft, unit: event.target.value as FoodUnit })
            }
          >
            {["g", "oz", "cup", "piece", "serving", "ml", "slice"].map(
              (unit) => (
                <option key={unit}>{unit}</option>
              ),
            )}
          </select>
        </label>
      </div>
      <p className="text-xs text-slate-400">
        All values below describe the serving quantity above. Changing the
        serving label does not guess or recalculate label values. Adjust values
        to match the package.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {nutrientFields.slice(0, 4).map((key) => (
          <label key={key} className="text-sm text-slate-300">
            {nutrientLabels[key][0]} ({nutrientLabels[key][1]})
            <Input
              aria-label={`Product ${nutrientLabels[key][0]}`}
              type="number"
              min={0}
              step="any"
              value={draft.values[key]}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  values: { ...draft.values, [key]: event.target.value },
                })
              }
            />
          </label>
        ))}
      </div>
      <details className="rounded-xl bg-slate-800 p-3">
        <summary className="text-sm text-green-400 cursor-pointer min-h-8">
          Additional nutrients (optional)
        </summary>{" "}
        <div className="grid grid-cols-2 gap-3">
          {nutrientFields.slice(4).map((key) => (
            <label key={key} className="text-sm text-slate-300">
              {nutrientLabels[key][0]} ({nutrientLabels[key][1]})
              <Input
                aria-label={`Product ${nutrientLabels[key][0]}`}
                type="number"
                min={0}
                step="any"
                value={draft.values[key]}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    values: { ...draft.values, [key]: event.target.value },
                  })
                }
              />
            </label>
          ))}
        </div>
      </details>
      <label className="flex gap-3 text-sm text-slate-300 min-h-11 items-center">
        <input
          type="checkbox"
          checked={saveLocal}
          onChange={(event) => setSaveLocal(event.target.checked)}
        />
        Save this reviewed product to Food Database for offline use
      </label>
      {draft.source === "Open Food Facts" && (
        <p className="text-xs text-slate-400">
          Product data:{" "}
          <a
            href={draft.sourceUrl ?? "https://world.openfoodfacts.org"}
            target="_blank"
            rel="noreferrer"
            className="text-green-400 underline"
          >
            Open Food Facts
          </a>{" "}
          ·{" "}
          <a
            href="https://opendatacommons.org/licenses/odbl/1-0/"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            ODbL
          </a>
          . Community data may be incomplete; verify the package label.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={onBack} disabled={busy}>
          Back to Barcode
        </Button>
        <Button
          className="bg-green-400 text-slate-950"
          disabled={busy}
          onClick={confirm}
        >
          Use Reviewed Food
        </Button>
      </div>
    </div>
  );
}
