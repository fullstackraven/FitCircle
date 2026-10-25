import { test } from "node:test";
import assert from "node:assert/strict";
import {
  completedFasts,
  fastingProgress,
} from "../client/src/lib/wellness-progress";
import {
  fastingDailyHours,
  recentWellnessActivity,
} from "../client/src/lib/wellness-activity";

const now = new Date(2026, 9, 21, 12);
const overnight = {
  id: "overnight",
  startDate: "2026-10-20",
  startTime: "18:00",
  endDate: "2026-10-21",
  endTime: "10:00",
  duration: 960,
  loggedAt: "2026-10-21T14:00:00Z",
  metadata: "retain",
};
test("overnight fast is credited in full to its local end day, with no active session", () => {
  const logs = [overnight];
  const raw = JSON.stringify(logs);
  const stats = fastingProgress(logs, 16, now);
  assert.equal(stats.todayHours, 16);
  assert.equal(stats.percentage, 100);
  assert.equal(stats.activeHours, null);
  assert.deepEqual(fastingDailyHours(completedFasts(logs, now)), {
    "2026-10-21": 16,
  });
  assert.equal(JSON.stringify(logs), raw);
});
test("same-day fasts count; yesterday does not; multiple completions use longest rather than sum", () => {
  const today = {
    ...overnight,
    id: "same",
    startDate: "2026-10-21",
    startTime: "06:00",
    duration: 240,
  };
  const yesterday = {
    ...overnight,
    id: "old",
    startDate: "2026-10-19",
    endDate: "2026-10-20",
    duration: 1200,
  };
  assert.equal(fastingProgress([today], 16, now).todayHours, 4);
  assert.equal(fastingProgress([yesterday], 16, now).todayHours, 0);
  const logs = [overnight, today, yesterday];
  assert.equal(fastingProgress(logs, 16, now).todayHours, 16);
  // Activity charts deliberately aggregate all completions, not the longest.
  assert.equal(fastingDailyHours(completedFasts(logs, now))["2026-10-21"], 20);
  for (const days of [7, 30, 90] as const)
    assert.equal(
      recentWellnessActivity(
        fastingDailyHours(completedFasts(logs, now)),
        days,
        now,
      ).total,
      40,
    );
});
test("partial, achieved and exceeded goals preserve actual hours and cap visual progress", () => {
  for (const [goal, expected] of [
    [32, 50],
    [16, 100],
    [8, 100],
  ]) {
    const stats = fastingProgress([overnight], goal, now);
    assert.equal(stats.todayHours, 16);
    assert.equal(stats.percentage, expected);
  }
  for (const goal of [0, -1, NaN, Infinity])
    assert.equal(fastingProgress([overnight], goal, now).percentage, 0);
});
test("edits and deletions recompute from records without altering other history", () => {
  const historical = {
    ...overnight,
    id: "old",
    endDate: "2026-10-20",
    startDate: "2026-10-19",
  };
  const updated = { ...overnight, duration: 480, endTime: "02:00" };
  assert.equal(fastingProgress([historical, updated], 16, now).percentage, 50);
  assert.equal(fastingProgress([historical], 16, now).percentage, 0);
  assert.equal(
    fastingProgress(
      [{ ...overnight, endDate: "2026-10-20", startDate: "2026-10-19" }],
      16,
      now,
    ).todayHours,
    0,
  );
  assert.equal(historical.metadata, "retain");
});
test("local midnight resets progress; a midnight completion belongs to the new date", () => {
  const midnight = {
    ...overnight,
    startDate: "2026-10-20",
    startTime: "08:00",
    endTime: "00:00",
  };
  assert.equal(
    fastingProgress([midnight], 16, new Date(2026, 9, 20, 23, 59, 59))
      .todayHours,
    0,
  );
  assert.equal(
    fastingProgress([midnight], 16, new Date(2026, 9, 21, 0, 0)).todayHours,
    16,
  );
  assert.equal(
    fastingProgress([overnight], 16, new Date(2026, 9, 21, 23, 59, 59))
      .todayHours,
    16,
  );
  assert.equal(
    fastingProgress([overnight], 16, new Date(2026, 9, 22, 0, 0)).todayHours,
    0,
  );
});
test("DST overnight durations keep their full recorded elapsed time on the end date", () => {
  // Local-time legacy durations require a real DST zone. Keep this synchronous
  // test isolated from the runner's timezone and restore it even on failure.
  const previousTimezone = process.env.TZ;
  try {
    process.env.TZ = "America/New_York";
    for (const [startDate, endDate, hours] of [
      ["2026-03-07", "2026-03-08", 15],
      ["2026-10-31", "2026-11-01", 17],
    ] as const) {
      const record = { ...overnight, startDate, endDate, duration: hours * 60 };
      const end = new Date(`${endDate}T12:00:00`);
      assert.equal(fastingProgress([record], 16, end).todayHours, hours);
      assert.equal(completedFasts([record], end)[0].date, endDate);
      const { duration, ...legacy } = record;
      assert.equal(fastingProgress([legacy], 16, end).todayHours, hours);
    }
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});
test("future completions, malformed end dates/times and invalid durations do not populate today", () => {
  const logs = [
    { ...overnight, endDate: "2026-10-22" },
    { ...overnight, endTime: "13:00" },
    { ...overnight, endDate: "bad" },
    { ...overnight, endDate: "2026-02-30" },
    { ...overnight, endTime: "bad" },
    { ...overnight, startDate: "2026-10-21", startTime: "11:00" },
    ...[0, -60, NaN, Infinity, "bad"].map((duration) => ({
      ...overnight,
      duration,
    })),
  ];
  assert.equal(fastingProgress(logs, 16, now).todayHours, 0);
  assert.equal(fastingProgress(logs, 16, now).percentage, 0);
  assert.equal(completedFasts(logs, now).length, 0);
});

test("fasting records and metadata round-trip through the unchanged JSON backup format", async () => {
  const { createBackup, prepareRestore, applyRestore } = await import(
    "../client/src/lib/backup"
  );
  const { IDBFactory } = await import("fake-indexeddb");
  class Memory implements Storage {
    data = new Map<string, string>();
    get length() {
      return this.data.size;
    }
    key(i: number) {
      return [...this.data.keys()][i] ?? null;
    }
    getItem(k: string) {
      return this.data.get(k) ?? null;
    }
    setItem(k: string, v: string) {
      this.data.set(k, v);
    }
    removeItem(k: string) {
      this.data.delete(k);
    }
    clear() {
      this.data.clear();
    }
  }
  const source = new Memory(),
    raw = JSON.stringify([overnight], null, 2);
  source.setItem("fitcircle_fasting_logs", raw);
  const backup = await createBackup(source, new IDBFactory());
  const restored = new Memory();
  applyRestore(prepareRestore(backup), restored, new Memory());
  assert.equal(restored.getItem("fitcircle_fasting_logs"), raw);
  assert.equal(source.getItem("fitcircle_fasting_logs"), raw);
  assert.equal(
    fastingProgress(
      JSON.parse(restored.getItem("fitcircle_fasting_logs")!),
      16,
      now,
    ).todayHours,
    16,
  );
});
