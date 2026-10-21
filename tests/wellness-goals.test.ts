import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cardioProgress,
  dailyTotals,
  fastingProgress,
  percentage,
  wellnessGoal,
  windowStats,
  historicalStats,
  calendarDates,
} from "../client/src/lib/wellness-progress";
const now = new Date(2026, 9, 21, 12);
test("weekly cardio target is used once and only Sunday through today counts", () => {
  const data = {
    goal: { target: 150, type: "duration", period: "week" },
    entries: [
      { date: "2026-10-18", duration: 50 },
      { date: "2026-10-21", duration: 25 },
      { date: "2026-10-17", duration: 100 },
      { date: "2026-10-22", duration: 500 },
    ],
  };
  const before = JSON.stringify(data);
  assert.equal(cardioProgress(data, now).percentage, 50);
  assert.equal(cardioProgress(data, now).target, 150);
  assert.equal(JSON.stringify(data), before);
  assert.equal(cardioProgress(data, new Date(2026, 9, 25, 12)).current, 0);
  data.goal.period = "day";
  assert.equal(cardioProgress(data, now).current, 25);
  assert.equal(cardioProgress(data, new Date(2026, 9, 25, 12)).current, 0);
});
test("stale caches and year-old activity cannot count toward today", () => {
  const hydration = {
    currentDayOz: 99,
    lastDate: "2024-01-01",
    logs: { "2024-01-01": { entries: [{ amount: 99 }] } },
  };
  const meditation = {
    currentDayMinutes: 99,
    dailyLogs: { "2024-01-01": { sessions: [{ duration: 99 }] } },
  };
  for (const [kind, data] of [
    ["hydration", hydration],
    ["meditation", meditation],
  ] as const) {
    const totals = dailyTotals(kind, data);
    assert.equal(totals["2026-10-21"] ?? 0, 0);
    assert.equal(windowStats(totals, now).total, 0);
  }
});
test("valid sessions override contradictory daily caches; legacy forms are read-only", () => {
  const modern = {
    dailyLogs: {
      "2026-10-21": {
        totalMinutes: 999,
        sessions: [
          { duration: 5 },
          { duration: "10" },
          { duration: -1 },
          { duration: Infinity },
        ],
      },
    },
  };
  assert.equal(dailyTotals("meditation", modern)["2026-10-21"], 15);
  assert.equal(
    dailyTotals("meditation", [{ date: "10/21/2026", duration: 15 }])[
      "2026-10-21"
    ],
    15,
  );
  assert.equal(
    dailyTotals("hydration", {
      logs: {
        "2026-10-21": {
          totalOz: 100,
          entries: [{ amount: 8 }, { amount: 0 }, { amount: -9 }],
        },
      },
    })["2026-10-21"],
    8,
  );
});
test("shared goal precedence and invalid values never yield invalid percentages", () => {
  assert.equal(wellnessGoal("meditationMinutes", {}, null), 20);
  assert.equal(wellnessGoal("hydrationOz", { hydrationOz: 80 }, "64", 32), 80);
  assert.equal(wellnessGoal("hydrationOz", { hydrationOz: 0 }, "64", 32), 0);
  for (const value of [0, -1, null, undefined, "bad", NaN, Infinity])
    assert.equal(percentage(20, value), 0);
  assert.equal(percentage(-5, 10), 0);
  assert.equal(percentage(16, 16), 100);
});
test("sixteen-hour completed fast meets duration goal, belongs to end day, and is never active", () => {
  const logs = [
    {
      startDate: "2026-10-20",
      startTime: "18:00",
      endDate: "2026-10-21",
      endTime: "10:00",
      duration: 960,
    },
  ];
  const before = JSON.stringify(logs),
    p = fastingProgress(logs, 16, now);
  assert.equal(p.percentage, 100);
  assert.equal(p.activeHours, null);
  assert.equal(p.todayHours, 16);
  assert.equal(p.consistency, 10);
  assert.equal(p.completedAverage, 16);
  assert.equal(p.calendarDayAverage, 1.6);
  assert.equal(JSON.stringify(logs), before);
  assert.equal(fastingProgress(logs, 32, now).percentage, 50);
  assert.equal(
    fastingProgress(logs, 16, new Date(2028, 9, 21, 12)).percentage,
    0,
  );
});
test("recent averages include inactive calendar days; historical averages identify both denominators", () => {
  const totals = {
    "2026-10-20": 20,
    "2026-10-21": 40,
    "2026-10-22": 999,
    invalid: Infinity,
  };
  assert.equal(windowStats(totals, now).average, 6);
  assert.deepEqual(historicalStats(totals, now), {
    total: 60,
    calendarDays: 2,
    loggedDays: 2,
    average: 30,
    loggedDayAverage: 30,
  });
  assert.equal(calendarDates(new Date(2026, 2, 9, 12), 3)[2], "2026-03-07");
});
test("local midnight and DST calendar windows exclude yesterday without elapsed-hour rounding", () => {
  const totals = { "2026-10-21": 64 };
  assert.equal(windowStats(totals, new Date(2026, 9, 22, 0, 0), 1).total, 0);
  assert.equal(
    historicalStats({ "2026-10-31": 10 }, new Date(2026, 10, 2, 12))
      .calendarDays,
    3,
  );
});

import {
  editHydration,
  changeMeditation,
} from "../client/src/lib/wellness-records";
import { currentWellness } from "../client/src/lib/wellness-storage";
import {
  createBackup,
  prepareRestore,
  applyRestore,
} from "../client/src/lib/backup";
import { IDBFactory } from "fake-indexeddb";
class Store implements Storage {
  values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  key(i: number) {
    return [...this.values.keys()][i] ?? null;
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  clear() {
    this.values.clear();
  }
}
test("historical hydration edits/deletes never change today's record totals", () => {
  const data = {
    currentDayOz: 8,
    lastDate: "2026-10-21",
    dailyGoalOz: 64,
    logs: {
      "2026-10-20": {
        date: "2026-10-20",
        totalOz: 20,
        entries: [{ id: "old", amount: 20 }],
      },
      "2026-10-21": {
        date: "2026-10-21",
        totalOz: 8,
        entries: [{ id: "today", amount: 8 }],
      },
    },
  };
  const before = JSON.stringify(data),
    edited = editHydration(data, "old", { amount: 40 }, "2026-10-21");
  assert.equal(edited.currentDayOz, 8);
  assert.equal(
    editHydration(edited, "old", null, "2026-10-21").currentDayOz,
    8,
  );
  assert.equal(JSON.stringify(data), before);
  assert.deepEqual(edited.logs["2026-10-21"], data.logs["2026-10-21"]);
});
test("legacy meditation edits preserve format, dates, metadata and today's totals", () => {
  const old = {
    id: "old",
    date: "10/20/2026",
    duration: 20,
    retained: { synthetic: true },
  };
  const today = { id: "today", date: "2026-10-21", duration: 5 };
  const logs = [old, today],
    before = JSON.stringify(logs);
  const edited = changeMeditation(
    logs,
    "2026-10-20",
    "old",
    { duration: 40 },
    "2026-10-21",
  );
  assert.ok(Array.isArray(edited));
  assert.equal(edited[0].date, "10/20/2026");
  assert.deepEqual(edited[0].retained, old.retained);
  assert.equal(dailyTotals("meditation", edited)["2026-10-21"], 5);
  const deleted = changeMeditation(
    edited,
    "2026-10-20",
    "old",
    null,
    "2026-10-21",
  );
  assert.deepEqual(deleted, [today]);
  assert.equal(JSON.stringify(logs), before);
});
test("shared overview and selectors agree across modern and legacy records without writes, then complete backup round trips", async () => {
  const s = new Store();
  s.setItem(
    "fitcircle_goals",
    '{"hydrationOz":64,"meditationMinutes":20,"fastingHours":16}',
  );
  s.setItem("fitcircle_goal_meditation", "10");
  s.setItem(
    "fitcircle_hydration_data",
    JSON.stringify({
      dailyGoalOz: 100,
      currentDayOz: 999,
      lastDate: "2024-01-01",
      logs: {
        "2026-10-21": {
          date: "2026-10-21",
          totalOz: 32,
          entries: [{ id: "h", time: "10:00 AM", amount: 32 }],
        },
      },
    }),
  );
  s.setItem(
    "fitcircle_meditation_logs",
    JSON.stringify([
      {
        id: "m",
        date: "2026-10-21",
        time: "10:00 AM",
        duration: 10,
        completedAt: "2026-10-21T10:00:00Z",
      },
    ]),
  );
  s.setItem(
    "fitcircle_fasting_logs",
    JSON.stringify([
      {
        id: "f",
        startDate: "2026-10-20",
        startTime: "18:00",
        endDate: "2026-10-21",
        endTime: "10:00",
        duration: 960,
        loggedAt: "2026-10-21T10:00:00Z",
      },
    ]),
  );
  s.setItem(
    "fitcircle_cardio_data",
    JSON.stringify({
      dailyLogs: {
        "2026-10-21": {
          date: "2026-10-21",
          totalDuration: 75,
          totalDistance: 0,
          sessions: [
            { id: "c", time: "10:00 AM", type: "walking", duration: 75 },
          ],
        },
      },
      goal: { type: "duration", period: "week", target: 150 },
      goalUserSet: true,
      customTypes: [],
      lastDate: "2026-10-21",
      currentDayDuration: 75,
      currentDayDistance: 0,
    }),
  );
  const before = [...s.values],
    value = currentWellness(s, now);
  assert.equal(value.hydration.percentage, 50);
  assert.equal(value.meditation.percentage, 50);
  assert.equal(value.fasting.percentage, 100);
  assert.equal(value.cardio.percentage, 50);
  assert.deepEqual([...s.values], before);
  const inactive = currentWellness(s, new Date(2028, 9, 21, 12));
  for (const p of [
    inactive.hydration,
    inactive.meditation,
    inactive.cardio,
    inactive.fasting,
  ])
    assert.equal(p.percentage, 0);
  const backup = await createBackup(s, new IDBFactory()),
    restored = new Store();
  applyRestore(prepareRestore(backup), restored, restored);
  assert.deepEqual([...restored.values].sort(), before.sort());
});

test("overflow and non-finite numeric inputs never produce non-finite progress", () => {
  for (const value of [Infinity, -Infinity, NaN, 1e308, -1, 0, "unknown"]) {
    const totals = dailyTotals("hydration", {
      logs: { "2026-10-21": { entries: [{ amount: value }] } },
    });
    assert.equal(windowStats(totals, now).total, 0);
    assert.ok(Number.isFinite(percentage(value, 16)));
  }
});

import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useHydration } from "../client/src/hooks/use-hydration";
import { useMeditation } from "../client/src/hooks/use-meditation";
import { useFasting } from "../client/src/hooks/use-fasting";
import { useCardio } from "../client/src/hooks/use-cardio";
import { useGoals } from "../client/src/hooks/use-goals";
test("actual hooks and Goals overview return identical fixed-date progress, with no initialization writes", async (context) => {
  context.mock.timers.enable({ apis: ["Date"], now: now.getTime() });
  const s = new Store();
  s.setItem(
    "fitcircle_goals",
    '{"hydrationOz":64,"meditationMinutes":20,"fastingHours":16,"maxFastingHours":24}',
  );
  s.setItem(
    "fitcircle_hydration_data",
    JSON.stringify({
      dailyGoalOz: 80,
      currentDayOz: 999,
      lastDate: "2024-01-01",
      logs: {
        "2026-10-21": {
          date: "2026-10-21",
          totalOz: 32,
          entries: [{ id: "h", amount: 32, time: "10:00 AM" }],
        },
      },
    }),
  );
  s.setItem(
    "fitcircle_meditation_logs",
    JSON.stringify({
      dailyLogs: {
        "2026-10-21": {
          date: "2026-10-21",
          totalMinutes: 99,
          sessions: [
            {
              id: "m",
              duration: 10,
              time: "10:00 AM",
              completedAt: "2026-10-21T10:00:00Z",
            },
          ],
        },
      },
      lastDate: "2024-01-01",
      currentDayMinutes: 999,
    }),
  );
  s.setItem(
    "fitcircle_fasting_logs",
    JSON.stringify([
      {
        id: "f",
        startDate: "2026-10-20",
        startTime: "18:00",
        endDate: "2026-10-21",
        endTime: "10:00",
        duration: 960,
        loggedAt: "2026-10-21T10:00:00Z",
      },
    ]),
  );
  s.setItem(
    "fitcircle_cardio_data",
    JSON.stringify({
      dailyLogs: {
        "2026-10-21": {
          date: "2026-10-21",
          totalDuration: 999,
          totalDistance: 0,
          sessions: [
            { id: "c", duration: 75, type: "walking", time: "10:00 AM" },
          ],
        },
      },
      goal: { type: "duration", period: "week", target: 150 },
      goalUserSet: true,
      customTypes: [],
      lastDate: "2024-01-01",
      currentDayDuration: 999,
      currentDayDistance: 0,
    }),
  );
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage"),
    before = [...s.values];
  Object.defineProperty(globalThis, "localStorage", {
    value: s,
    configurable: true,
  });
  s.setItem = () => assert.fail("initialization and selectors must not write");
  let snapshot!: ReturnType<ReturnType<typeof useGoals>["calculateProgress"]>;
  function Probe() {
    const h = useHydration(),
      m = useMeditation(),
      f = useFasting(),
      c = useCardio(),
      g = useGoals();
    assert.equal(h.progressPercentage, 50);
    assert.equal(h.getAllLogs()[0].totalOz, 32);
    assert.equal(m.getProgressPercentage(), 50);
    assert.equal(m.dailyLogs["2026-10-21"].totalMinutes, 10);
    assert.equal(f.stats.percentage, 100);
    assert.equal(c.getTodaysProgress().progress, 50);
    assert.equal(c.data.dailyLogs["2026-10-21"].totalDuration, 75);
    snapshot = g.calculateProgress();
    return null;
  }
  try {
    renderToString(createElement(Probe));
    const result = await snapshot;
    assert.equal(result.hydrationProgress, 50);
    assert.equal(result.meditationProgress, 50);
    assert.equal(result.fastingProgress, 100);
    assert.equal(result.cardioProgress, 50);
    assert.deepEqual([...s.values], before);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});

test("malformed shared goals cannot turn default goals into apparent achievement", () => {
  const s = new Store();
  s.setItem("fitcircle_goals", "{ invalid");
  s.setItem(
    "fitcircle_hydration_data",
    JSON.stringify({ logs: { "2026-10-21": { entries: [{ amount: 64 }] } } }),
  );
  const before = [...s.values],
    value = currentWellness(s, now);
  assert.equal(value.hydration.target, 0);
  assert.equal(value.hydration.percentage, 0);
  assert.equal(value.meditation.target, 0);
  assert.equal(value.fasting.percentage, 0);
  assert.deepEqual([...s.values], before);
});

test("supported legacy meditation objects remain byte-exact through complete export/import without mount migration", async () => {
  const s = new Store();
  const legacy = {
    logs: [
      {
        id: "legacy",
        date: "10/21/2026",
        time: "10:00 AM",
        duration: 20,
        completedAt: "2026-10-21T10:00:00.123Z",
        retained: "synthetic",
      },
    ],
    retained: { value: "unchanged" },
  };
  const raw = JSON.stringify(legacy, null, 2);
  s.setItem("fitcircle_meditation_logs", raw);
  const backup = await createBackup(s, new IDBFactory()),
    restored = new Store();
  applyRestore(prepareRestore(backup), restored, restored);
  assert.equal(restored.getItem("fitcircle_meditation_logs"), raw);
  assert.equal(dailyTotals("meditation", JSON.parse(raw))["2026-10-21"], 20);
  assert.equal(s.getItem("fitcircle_meditation_logs"), raw);
  assert.throws(() =>
    prepareRestore({
      fitcircle_meditation_logs: { logs: legacy.logs, dailyLogs: "malformed" },
    }),
  );
});

test("shared readers apply the same container validation as feature hooks, including partially invalid histories", () => {
  const s = new Store();
  s.setItem(
    "fitcircle_goals",
    '{"hydrationOz":64,"meditationMinutes":20,"fastingHours":16}',
  );
  s.setItem(
    "fitcircle_hydration_data",
    JSON.stringify({
      logs: {
        "2026-10-21": { entries: [{ amount: 64 }] },
        "2026-10-20": { entries: "malformed" },
      },
    }),
  );
  s.setItem(
    "fitcircle_meditation_logs",
    JSON.stringify([null, { date: "2026-10-21", duration: 20 }]),
  );
  s.setItem(
    "fitcircle_fasting_logs",
    JSON.stringify([
      {
        id: "complete",
        startDate: "2026-10-20",
        startTime: "18:00",
        endDate: "2026-10-21",
        endTime: "10:00",
        duration: 960,
      },
      { id: "incomplete" },
    ]),
  );
  const before = [...s.values],
    value = currentWellness(s, now);
  assert.equal(value.hydration.percentage, 0);
  assert.equal(value.meditation.percentage, 0);
  assert.equal(value.fasting.percentage, 0);
  assert.deepEqual([...s.values], before);
});

test("incomplete aggregate-only meditation history is never replaced with a guessed session list", () => {
  const data = {
    dailyLogs: { "2026-10-21": { date: "2026-10-21", totalMinutes: 20 } },
    lastDate: "2026-10-21",
    currentDayMinutes: 20,
  };
  const before = JSON.stringify(data);
  assert.throws(
    () =>
      changeMeditation(
        data,
        "2026-10-21",
        null,
        { id: "new", duration: 10 },
        "2026-10-21",
      ),
    /incomplete/,
  );
  assert.equal(JSON.stringify(data), before);
});

import {
  hydrationRecord,
  meditationRecord,
  fastingRecord,
} from "../client/src/lib/wellness-records";
test("malformed nested fields are blocked before rendering or saving, not merely clamped after a render failure", () => {
  assert.equal(
    hydrationRecord({
      logs: {
        "2026-10-21": {
          entries: [{ amount: { unexpected: true }, time: "10:00 AM" }],
        },
      },
    }),
    false,
  );
  assert.equal(
    meditationRecord([
      { date: "2026-10-21", duration: { unexpected: true }, time: "10:00 AM" },
    ]),
    false,
  );
  assert.equal(
    meditationRecord({
      dailyLogs: {
        "2026-10-21": {
          sessions: [{ duration: 20, time: { unexpected: true } }],
        },
      },
    }),
    false,
  );
  assert.equal(
    fastingRecord([
      {
        id: "f",
        startDate: "2026-10-20",
        endDate: "2026-10-21",
        startTime: "18:00",
        endTime: "10:00",
        duration: { unexpected: true },
      },
    ]),
    false,
  );
});
