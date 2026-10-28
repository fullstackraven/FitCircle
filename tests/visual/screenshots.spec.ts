import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import type { VisualCapture } from "../fixtures/visual-review";

function manifests(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? manifests(file) : file.endsWith(".visual.json") ? [file] : [];
  });
}

const captures = manifests(path.resolve(process.env.VISUAL_CAPTURE_DIR || "test-results")).sort();
if (!captures.length) {
  test("visual captures are available for review", () => {
    throw new Error("No captures found. Run the browser tests or download their artifacts first.");
  });
}
for (const file of captures) {
  const capture: VisualCapture = JSON.parse(fs.readFileSync(file, "utf8"));
  test(`${capture.title} › ${path.basename(capture.expected)}`, async ({}, info) => {
    const image = path.join(path.dirname(file), capture.image);
    await info.attach("captured screenshot", { path: image, contentType: "image/png" });
    expect(fs.readFileSync(image)).toMatchSnapshot(capture.expected.split(/[\\/]/), capture.comparison);
  });
}
