import { test, type Locator, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export interface VisualCapture {
  expected: string;
  image: string;
  title: string;
  comparison: { threshold?: number; maxDiffPixels?: number; maxDiffPixelRatio?: number };
}

type VisualOptions = NonNullable<Parameters<Page["screenshot"]>[0]> & VisualCapture["comparison"];

/** Capture in the mandatory browser test; compare only in the advisory job. */
export async function captureVisual(target: Page | Locator, name: string, options: VisualOptions = {}) {
  const info = test.info();
  const { threshold, maxDiffPixels, maxDiffPixelRatio, ...capture } = options;
  const image = info.outputPath("visual", name);
  fs.mkdirSync(path.dirname(image), { recursive: true });
  const page = "goto" in target ? target : target.page();
  await page.evaluate(() => document.fonts.ready);
  await target.screenshot({ animations: "disabled", ...capture, path: image });
  const manifest: VisualCapture = {
    expected: path.relative(process.cwd(), info.snapshotPath(name)),
    image: path.basename(image),
    title: info.titlePath.join(" › "),
    // Preserve each original matcher setting, including its default threshold.
    comparison: { threshold, maxDiffPixels, maxDiffPixelRatio },
  };
  fs.writeFileSync(`${image}.visual.json`, JSON.stringify(manifest, null, 2));
  await info.attach(name, { path: image, contentType: "image/png" });
}
