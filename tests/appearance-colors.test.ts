import { test } from "node:test";
import assert from "node:assert/strict";
import {
  colorClassMap,
  strokeColorMap,
  getColorClass,
  getStrokeColor,
  getLightStrokeColor,
} from "../client/src/lib/color-utils";
const luminance = (hex: string) =>
  [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
    .reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0);
test("Light presentation keeps the twelve persisted hue identities and meets graphical contrast on the canvas", () => {
  const original = JSON.stringify({ colorClassMap, strokeColorMap });
  const identifiers = [
    "green",
    "blue",
    "purple",
    "amber",
    "red",
    "pink",
    "cyan",
    "lime",
    "orange",
    "indigo",
    "emerald",
    "yellow",
  ];
  assert.deepEqual(Object.keys(colorClassMap), identifiers);
  for (const id of identifiers) {
    const light = getLightStrokeColor(id);
    const values = [luminance(light), luminance("#f8fafc")].sort(
      (a, b) => a - b,
    );
    assert.ok(
      (values[1] + 0.05) / (values[0] + 0.05) >= 3,
      `${id} must remain visible`,
    );
    assert.equal(getStrokeColor(id), strokeColorMap[id]);
    assert.equal(getColorClass(id), `workout-${id}`);
  }
  assert.equal(JSON.stringify({ colorClassMap, strokeColorMap }), original);
  assert.equal(
    getLightStrokeColor("legacy-unknown"),
    getLightStrokeColor("green"),
  );
});
