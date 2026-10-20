import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarcodeScanner } from "./BarcodeScanner";
import { ProductReview } from "./ProductReview";
import { lookupBarcode, type ProductDraft } from "@/lib/barcode-lookup";
import { localFoodService, type LocalFoodItem } from "@/lib/local-food-service";
export function BarcodeEntry({
  onReviewed,
}: {
  onReviewed: (food: LocalFoodItem) => void;
}) {
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [product, setProduct] = useState<{
    local: LocalFoodItem | null;
    draft: ProductDraft;
  } | null>(null);
  const request = useRef<AbortController>();
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      request.current?.abort();
    };
  }, []);
  const lookup = async (value: string) => {
    setScanning(false);
    setError("");
    setBusy(true);
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const result = await lookupBarcode(
        value,
        (code) => localFoodService.getProductByBarcode(code),
        { online: navigator.onLine, signal: controller.signal },
      );
      if (alive.current && !controller.signal.aborted) setProduct(result);
    } catch (failure) {
      if (alive.current)
        setError(
          controller.signal.aborted
            ? "Lookup timed out or was cancelled. Your records are unchanged."
            : failure instanceof Error
              ? failure.message
              : "Lookup failed. Enter the label manually.",
        );
    } finally {
      clearTimeout(timeout);
      if (alive.current) setBusy(false);
    }
  };
  if (product)
    return (
      <ProductReview
        initial={product.draft}
        local={product.local}
        onReviewed={onReviewed}
        onBack={() => setProduct(null)}
      />
    );
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Saved products work offline. Unknown barcode lookups send only the
        barcode to Open Food Facts when online.
      </p>
      {scanning ? (
        <BarcodeScanner
          onFound={(code) => {
            setCode(code);
            void lookup(code);
          }}
          onStop={() => setScanning(false)}
        />
      ) : (
        <Button
          variant="outline"
          className="w-full"
          disabled={busy}
          onClick={() => setScanning(true)}
        >
          Start Camera
        </Button>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void lookup(code);
        }}
        className="space-y-3"
      >
        <label className="block text-sm text-slate-300">
          Manual barcode
          <Input
            aria-label="Manual barcode"
            inputMode="numeric"
            autoComplete="off"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </label>
        <Button
          disabled={busy || !code.trim()}
          type="submit"
          className="w-full bg-green-400 text-slate-950"
        >
          {busy ? "Looking up…" : "Find Product"}
        </Button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-amber-300">
          {error}
        </p>
      )}
      <p className="text-xs text-slate-400">
        Supports UPC-A, UPC-E, EAN-13 and EAN-8. Camera permission and HTTPS are
        required; manual entry is always available.{" "}
        <a
          href="https://world.openfoodfacts.org"
          target="_blank"
          rel="noreferrer"
          className="text-green-400 underline"
        >
          Open Food Facts
        </a>{" "}
        data is licensed under ODbL.
      </p>
    </div>
  );
}
