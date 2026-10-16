import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useDashboardWidgets, type DashboardWidget } from '../client/src/hooks/use-dashboard-widgets';
import { useWorkouts } from '../client/src/hooks/use-workouts';
import { getDateString, parseLocalDate, getAllTimeHydrationAverage, getAllTimeCardioAverage, getAllTimeMeditationAverage, getAllTimeFastingAverage } from '../client/src/lib/date-utils';

// Server rendering runs initializers/selectors without autosave effects. This is
// a read-contract test, not proof of browser lifecycle or persistence safety.
function withStoredValue(key: string, raw: string, inspect: () => void) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (requested: string) => requested === key ? raw : null,
    setItem: () => assert.fail('Reading this modern fixture must not write storage'),
  } });
  try { inspect(); } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
}

const widgets: DashboardWidget[] = [
  { id: 'later', type: 'timer', title: 'Timer', enabled: true, position: 2, size: 'small' },
  { id: 'first', type: 'hydration', title: 'Water', enabled: false, position: 0, size: 'small' },
  { id: 'tie', type: 'quote', title: 'Quote', enabled: true, position: 2, size: 'small' },
];

test('reading available widgets preserves state while sorting positions and ties', () => {
  withStoredValue('fitcircle_dashboard_widgets', JSON.stringify(widgets), () => {
    function Probe() {
      const api = useDashboardWidgets();
      const original = structuredClone(api.widgets);
      const available = api.getAvailableWidgets();
      assert.deepEqual(available.map(w => w.id), ['first', 'later', 'tie']);
      assert.deepEqual(api.widgets, original);
      assert.notEqual(available, api.widgets);
      available.reverse();
      assert.deepEqual(api.getAvailableWidgets().map(w => w.id), ['first', 'later', 'tie']);
      assert.deepEqual(api.widgets, original);
      return null;
    }
    renderToString(createElement(Probe));
  });
});

test('enabled widget selection retains visibility, sorted order and original state', () => {
  withStoredValue('fitcircle_dashboard_widgets', JSON.stringify(widgets), () => {
    function Probe() {
      const api = useDashboardWidgets();
      assert.deepEqual(api.getEnabledWidgets().map(w => w.id), ['later', 'tie']);
      assert.deepEqual(api.widgets, widgets);
      return null;
    }
    renderToString(createElement(Probe));
  });
});

for (const zone of ['UTC', 'America/New_York', 'Europe/London', 'Australia/Sydney']) {
  test(`local and legacy date keys preserve calendar dates in ${zone}`, () => {
    const previous = process.env.TZ;
    process.env.TZ = zone;
    try {
      for (const date of ['2024-02-29', '2026-12-31', '2027-01-01', '2026-03-08', '2026-11-01']) {
        assert.equal(getDateString(parseLocalDate(date)), date);
        assert.equal(parseLocalDate(date).getHours(), 0);
      }
      assert.equal(getDateString(parseLocalDate('02/29/2024')), '2024-02-29');
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  });
}

test('empty wellness histories produce finite zero totals and averages', () => {
  assert.deepEqual(getAllTimeHydrationAverage({}), { averageOz: 0, totalDays: 0, totalOz: 0 });
  assert.deepEqual(getAllTimeCardioAverage([]), { averageDuration: 0, averageDistance: 0, totalDays: 0 });
  assert.deepEqual(getAllTimeMeditationAverage([]), { averageMinutes: 0, totalDays: 0, totalMinutes: 0 });
  assert.deepEqual(getAllTimeFastingAverage([]), { averageHours: 0, totalDays: 0, totalHours: 0 });
});

test('reading modern workout history retains authoritative goals and journal timestamps', () => {
  const fixture = {
    workouts: { a: { id: 'a', name: 'Synthetic exercise', color: 'green', count: 0, dailyGoal: 30,
      goalHistory: [{ goal: 20, timestamp: '2026-01-01T09:00:00Z' }] } },
    routines: {}, dailyLogs: { '2026-10-01': { a: { count: 12, goalAtTime: 20 } } },
    journalEntries: { '2026-10-01': { text: 'Synthetic journal', timestamp: '2026-10-01T17:00:00Z' } },
  };
  withStoredValue('workout-tracker-data', JSON.stringify(fixture), () => {
    function Probe() {
      const api = useWorkouts();
      assert.deepEqual(api.getDailyLogs(), fixture.dailyLogs);
      assert.deepEqual(api.getAllJournalEntries(), fixture.journalEntries);
      return null;
    }
    renderToString(createElement(Probe));
  });
});
