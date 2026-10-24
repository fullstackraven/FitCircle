import { test } from "node:test";
import assert from "node:assert/strict";
import {
  groupJournal,
  journalItems,
  journalDate,
  searchJournal,
} from "../client/src/lib/journal-library";
const now = new Date(2026, 9, 24, 12);
const records = {
  "2026-10-24": {
    text: "  Leg Day\n\nFocused on quads and protein.  ",
    timestamp: "2026-10-24T12:00:00Z",
    extra: "preserve",
  },
  "2026-10-23": "Yesterday",
  "2026-09-25": "Boundary included",
  "2026-09-24": "Boundary excluded",
  "2026-08-11": "Older protein reflection",
  "2025-10-11": "Old protein note",
  "2024-02-29": "Leap day",
  "10/11/2026": "Legacy date",
  broken: { text: "Undated reflection", timestamp: "bad" },
  "2026-02-30": "Impossible date",
  empty: "",
  unexpected: null,
};
test("calendar grouping retains every record exactly once without mutating data", () => {
  const before = JSON.stringify(records);
  const items = journalItems(records);
  const groups = groupJournal(items, now);
  assert.deepEqual(
    groups.map((g) => g.label),
    ["Previous 30 Days", "September", "August", "2025", "2024", "Undated"],
  );
  assert.equal(groups[0].entries.length, 4);
  assert.equal(
    new Set(groups.flatMap((g) => g.entries.map((i) => i.id))).size,
    Object.keys(records).length,
  );
  assert.equal(JSON.stringify(records), before);
  assert.equal(items.find((i) => i.id === "broken")?.timestamp, null);
  assert.equal(items.find((i) => i.id === "2026-10-24")?.title, "Leg Day");
  assert.equal(
    items.find((i) => i.id === "2026-10-24")?.text,
    records["2026-10-24"].text,
  );
});
test("January, leap and local calendar boundaries", () => {
  const entries = journalItems({
    "2025-12-31": "a",
    "2025-12-02": "b",
    "2025-12-01": "c",
    "2024-02-29": "d",
  });
  assert.deepEqual(
    groupJournal(entries, new Date(2026, 0, 1)).map((g) => [
      g.label,
      g.entries.length,
    ]),
    [
      ["Previous 30 Days", 1],
      ["2025", 2],
      ["2024", 1],
    ],
  );
  assert.ok(journalDate("2024-02-29"));
  assert.equal(journalDate("2025-02-29"), null);
  const dst = journalItems({
    "2026-03-09": "a",
    "2026-02-08": "b",
    "2026-02-07": "c",
  });
  assert.equal(groupJournal(dst, new Date(2026, 2, 9))[0].entries.length, 2);
});
test("text and date search across history", () => {
  const items = journalItems(records);
  for (const q of [
    " protein ",
    "PROTE",
    "old protein",
    "quads and protein",
    "Leg Day",
  ])
    assert.ok(searchJournal(items, q).length);
  for (const q of ["10/11/2026", "10/11/26", "2026-10-11", "October 11"])
    assert.equal(
      searchJournal(items, q).some((i) => i.id === "10/11/2026"),
      true,
      q,
    );
  for (const q of ["October 2026", "Oct 2026", "2026"])
    assert.ok(searchJournal(items, q).length, q);
  assert.equal(searchJournal(items, "2025").length, 1);
  assert.equal(searchJournal(items, "no matching phrase").length, 0);
  assert.equal(searchJournal(items, " ").length, items.length);
  assert.equal(searchJournal(items, "2026-02-30").length, 0);
});

test("unknown metadata and legacy journal bodies round-trip through full and legacy backups", async () => {
  const { createBackup, prepareRestore, applyRestore } = await import(
    "../client/src/lib/backup"
  );
  const { IDBFactory } = await import("fake-indexeddb");
  class Memory implements Storage {
    values = new Map<string, string>();
    get length() {
      return this.values.size;
    }
    key(i: number) {
      return [...this.values.keys()][i] ?? null;
    }
    getItem(k: string) {
      return this.values.get(k) ?? null;
    }
    setItem(k: string, v: string) {
      this.values.set(k, v);
    }
    removeItem(k: string) {
      this.values.delete(k);
    }
    clear() {
      this.values.clear();
    }
  }
  const source = new Memory();
  const valid: Record<string, unknown> = { ...records };
  delete valid.unexpected;
  const raw = JSON.stringify(
    { workouts: {}, routines: {}, dailyLogs: {}, journalEntries: valid },
    null,
    2,
  );
  source.setItem("workout-tracker-data", raw);
  const backup = await createBackup(source, new IDBFactory());
  for (const input of [backup, { "workout-tracker-data": raw }]) {
    const target = new Memory();
    applyRestore(prepareRestore(input), target, new Memory());
    assert.equal(target.getItem("workout-tracker-data"), raw);
    assert.equal(
      journalItems(JSON.parse(raw).journalEntries).length,
      Object.keys(valid).length,
    );
  }
  assert.equal(source.getItem("workout-tracker-data"), raw);
});

test("midnight regrouping, leap day and two legacy identifiers on one day never omit entries", () => {
  const items = journalItems({
    "2026-09-25": "a",
    "2026-10-24": "b",
    "10/24/2026": { text: "c", timestamp: "bad" },
  });
  assert.equal(
    groupJournal(items, new Date(2026, 9, 24, 23, 59))[0].entries.length,
    3,
  );
  assert.equal(
    groupJournal(items, new Date(2026, 9, 25, 0, 0))[0].entries.length,
    2,
  );
  const leap = journalItems({
    "2024-02-29": "a",
    "2024-02-01": "b",
    "2024-01-31": "c",
  });
  assert.equal(groupJournal(leap, new Date(2024, 2, 1))[0].entries.length, 2);
  assert.equal(searchJournal(items, "Oct 24").length, 2);
});
