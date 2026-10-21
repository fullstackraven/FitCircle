import { test } from "node:test";
import assert from "node:assert/strict";
import {
  recentWellnessActivity,
  fastingDailyHours,
} from "../client/src/lib/wellness-activity";
const now = new Date(2026, 9, 21, 12);
test("recent wellness windows use exactly 7/30/90 local dates and include inactive days", () => {
  const totals = {
    "2026-10-21": 20,
    "2026-10-15": 15,
    "2026-10-14": 100,
    "2026-10-22": 999,
    "2024-01-01": 999,
  };
  for (const days of [7, 30, 90] as const) {
    const result = recentWellnessActivity(totals, days, now);
    assert.equal(result.points.length, days);
    assert.equal(result.points.at(-1)?.date, "2026-10-21");
    assert.equal(result.total, days === 7 ? 35 : 135);
    assert.equal(result.average, result.total / days);
    assert.equal(result.activeDays, days === 7 ? 2 : 3);
  }
  assert.deepEqual(totals, {
    "2026-10-21": 20,
    "2026-10-15": 15,
    "2026-10-14": 100,
    "2026-10-22": 999,
    "2024-01-01": 999,
  });
});
test("recent displays reject negative/nonfinite values and retain explicit zero days", () => {
  const result = recentWellnessActivity(
    {
      "2026-10-21": Infinity,
      "2026-10-20": -2,
      "2026-10-19": NaN,
      "2026-10-18": 0,
    },
    7,
    now,
  );
  assert.equal(result.total, 0);
  assert.equal(result.average, 0);
  assert.equal(result.activeDays, 0);
});
test("completed fasting bars aggregate on end dates without inventing active state", () => {
  const source = [
    { date: "2026-10-21", hours: 16 },
    { date: "2026-10-21", hours: 1 },
    { date: "2026-10-20", hours: 12 },
  ];
  assert.deepEqual(fastingDailyHours(source), {
    "2026-10-21": 17,
    "2026-10-20": 12,
  });
  assert.equal(
    recentWellnessActivity(fastingDailyHours(source), 7, now).average,
    29 / 7,
  );
  assert.equal(source.length, 3);
});
