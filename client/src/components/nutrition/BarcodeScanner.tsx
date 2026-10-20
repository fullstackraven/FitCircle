import { useEffect, useRef, useState } from "react";
import { normalizeBarcode } from "@/lib/barcode";
/** Own the stream so permission/decoder races cannot leave a camera running. */
export function BarcodeScanner({
  onFound,
  onStop,
}: {
  onFound: (code: string) => void;
  onStop: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false,
      stream: MediaStream | undefined,
      controls: { stop: () => void } | undefined;
    const cleanup = () => {
      cancelled = true;
      controls?.stop();
      stream?.getTracks().forEach((track) => track.stop());
      if (video.current) video.current.srcObject = null;
    };
    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error(
            "Camera access requires a supported browser and HTTPS. Use manual barcode entry below.",
          );
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const [{ BrowserMultiFormatReader }, { BarcodeFormat }] =
          await Promise.all([
            import("@zxing/browser"),
            import("@zxing/library"),
          ]);
        if (cancelled) return;
        const reader = new BrowserMultiFormatReader(undefined, {
          delayBetweenScanAttempts: 250,
          delayBetweenScanSuccess: 1000,
        });
        reader.possibleFormats = [
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
        ];
        controls = await reader.decodeFromStream(
          stream,
          video.current!,
          (result) => {
            if (!result || cancelled) return;
            try {
              const code = normalizeBarcode(
                result.getText(),
                result.getBarcodeFormat() === BarcodeFormat.UPC_E,
              );
              cleanup();
              onFound(code);
            } catch {
              /* Keep scanning incomplete frames. */
            }
          },
        );
        if (cancelled) controls.stop();
      } catch (failure) {
        if (!cancelled) {
          cleanup();
          setError(
            failure instanceof Error
              ? `${failure.message} You can enter the printed barcode instead.`
              : "Camera unavailable. Use manual barcode entry.",
          );
        }
      }
    };
    const hidden = () => {
      if (document.hidden) {
        cleanup();
        onStop();
      }
    };
    document.addEventListener("visibilitychange", hidden);
    void start();
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      cleanup();
    };
  }, []);
  return (
    <div className="space-y-2">
      <video
        ref={video}
        autoPlay
        muted
        playsInline
        aria-label="Barcode camera preview"
        className="w-full aspect-video object-cover rounded-xl bg-slate-950"
      />
      <p className="text-xs text-slate-400">
        Center a UPC or EAN barcode in the camera. Images stay on your device.
      </p>
      {error && (
        <p role="alert" className="text-sm text-amber-300">
          {error}
        </p>
      )}
      <button className="min-h-11 text-green-400" onClick={onStop}>
        Stop Camera
      </button>
    </div>
  );
}
