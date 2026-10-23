import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarcodeScanner } from "./BarcodeScanner";
import { lookupBarcode, type ProductDraft } from "@/lib/barcode-lookup";
import { localFoodService, type LocalFoodItem } from "@/lib/local-food-service";
export function BarcodeEntry({
  onFound,
}: {
  onFound: (result: {
    local: LocalFoodItem | null;
    draft: ProductDraft;
  }) => void;
}) {
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
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
      if (alive.current && !controller.signal.aborted) onFound(result);
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
  return (
    <div className="space-y-4">
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
        <label className="block text-sm text-supporting">
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
          className="w-full bg-green-400 text-on-bright"
        >
          {busy ? "Looking up…" : "Find Product"}
        </Button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-warning-soft">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        <a
          href="https://world.openfoodfacts.org"
          target="_blank"
          rel="noreferrer"
          className="text-accent-text underline"
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
      </p>
    </div>
  );
}
