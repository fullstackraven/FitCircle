import { test } from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import {
  APPEARANCE_KEY,
  isAppearancePreference,
  resolveAppearance,
  startAppearanceController,
} from "../client/src/lib/appearance";
import {
  createBackup,
  prepareRestore,
  applyRestore,
} from "../client/src/lib/backup";
import { completeStorage } from "./fixtures/complete-storage";

class Store implements Storage {
  data = new Map<string, string>();
  failRead = false;
  failWrite = false;
  writes = 0;
  get length() {
    return this.data.size;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  getItem(key: string) {
    if (this.failRead) throw Error("read blocked");
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.failWrite) throw Error("quota");
    this.writes++;
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  clear() {
    this.data.clear();
  }
}
function browser(preference?: string, systemDark = false) {
  const storage = new Store();
  if (preference !== undefined) storage.data.set(APPEARANCE_KEY, preference);
  const media = Object.assign(new EventTarget(), { matches: systemDark });
  const host = Object.assign(new EventTarget(), {
    localStorage: storage,
    matchMedia: () => media,
    document: { documentElement: { dataset: {} as Record<string, string> } },
  });
  return {
    storage,
    media,
    host,
    start: (allowPreview = true) =>
      startAppearanceController({
        browser: host as unknown as Window,
        allowPreview,
      }),
  };
}

test("only exact dark/light/system strings are valid; invalid or absent preferences resolve dark on either OS", () => {
  for (const value of [
    undefined,
    null,
    "",
    "LIGHT",
    " dark",
    "auto",
    '"light"',
    {},
    1,
  ]) {
    assert.equal(isAppearancePreference(value), false);
    assert.equal(resolveAppearance(value, false), "dark");
    assert.equal(resolveAppearance(value, true), "dark");
  }
  for (const value of ["dark", "light", "system"])
    assert.equal(isAppearancePreference(value), true);
  assert.equal(resolveAppearance("dark", false), "dark");
  assert.equal(resolveAppearance("light", true), "light");
  assert.equal(resolveAppearance("system", false), "light");
  assert.equal(resolveAppearance("system", true), "dark");
});

for (const value of [undefined, "corrupt"])
  test(`startup with ${value} keeps dark without writes or replacing original bytes`, () => {
    const b = browser(value);
    const before = [...b.storage.data];
    const c = b.start();
    assert.equal(c.getSnapshot().applied, "dark");
    assert.equal(b.host.document.documentElement.dataset.appearance, "dark");
    assert.equal(b.storage.writes, 0);
    assert.deepEqual([...b.storage.data], before);
    c.stop();
  });

test("public production gate preserves dark even with a saved light or system preference", () => {
  for (const preference of ["light", "system"]) {
    const b = browser(preference);
    const c = b.start(false);
    assert.deepEqual(c.getSnapshot(), {
      preference,
      resolved: "light",
      applied: "dark",
      error: null,
    });
    assert.equal(b.storage.getItem(APPEARANCE_KEY), preference);
    c.stop();
  }
});

test("system changes, same-tab saves, cross-tab updates and lifecycle cleanup do not update fitness records", () => {
  const b = browser("system");
  b.storage.data.set(
    "workout-tracker-data",
    completeStorage["workout-tracker-data"],
  );
  const c = b.start();
  let notifications = 0;
  const unsubscribe = c.subscribe(() => notifications++);
  b.media.matches = true;
  b.media.dispatchEvent(new Event("change"));
  assert.equal(c.getSnapshot().applied, "dark");
  assert.equal(notifications, 1);
  b.media.dispatchEvent(new Event("change"));
  assert.equal(notifications, 1);
  assert.deepEqual(c.setPreference("light"), { ok: true });
  b.media.dispatchEvent(new Event("change"));
  assert.equal(c.getSnapshot().applied, "light");
  b.storage.data.set(APPEARANCE_KEY, "dark");
  b.host.dispatchEvent(
    Object.assign(new Event("storage"), { key: APPEARANCE_KEY }),
  );
  assert.equal(c.getSnapshot().applied, "dark");
  b.storage.data.delete(APPEARANCE_KEY);
  b.host.dispatchEvent(Object.assign(new Event("storage"), { key: null }));
  assert.equal(c.getSnapshot().preference, "dark");
  b.storage.data.set(APPEARANCE_KEY, "system");
  b.media.matches = false;
  b.host.dispatchEvent(new Event("pageshow"));
  assert.equal(c.getSnapshot().applied, "light");
  assert.equal(
    b.storage.getItem("workout-tracker-data"),
    completeStorage["workout-tracker-data"],
  );
  unsubscribe();
  const last = c.getSnapshot();
  c.stop();
  b.media.matches = true;
  b.media.dispatchEvent(new Event("change"));
  b.host.dispatchEvent(new Event("pageshow"));
  assert.equal(c.getSnapshot(), last);
  assert.equal(c.setPreference("dark").ok, false);
});

test("invalid saves and storage failures never claim success or overwrite records", () => {
  const b = browser("system", true);
  const c = b.start();
  assert.equal(c.setPreference("auto").ok, false);
  assert.equal(b.storage.writes, 0);
  b.storage.failWrite = true;
  assert.equal(c.setPreference("light").ok, false);
  assert.equal(c.getSnapshot().preference, "system");
  assert.match(c.getSnapshot().error!, /could not be saved/);
  assert.equal(b.storage.getItem(APPEARANCE_KEY), "system");
  c.stop();
  b.storage.failRead = true;
  const unavailable = b.start();
  assert.equal(unavailable.getSnapshot().applied, "dark");
  assert.match(unavailable.getSnapshot().error!, /could not be read/);
  unavailable.stop();
});

test("explicit saved preference survives controller recreation without default writes", () => {
  const b = browser();
  let c = b.start();
  assert.equal(c.setPreference("system").ok, true);
  c.stop();
  c = b.start();
  assert.equal(c.getSnapshot().preference, "system");
  assert.equal(c.getSnapshot().applied, "light");
  assert.equal(b.storage.writes, 1);
  c.stop();
});

test("all preferences round-trip complete v2 JSON backups without altering unrelated data", async () => {
  for (const preference of ["dark", "light", "system"]) {
    const source = new Store();
    for (const [key, value] of Object.entries(completeStorage))
      source.data.set(key, value);
    source.data.set(APPEARANCE_KEY, preference);
    const before = [...source.data];
    const warnings: string[] = [];
    const backup = await createBackup(source, new IDBFactory(), (warning) =>
      warnings.push(warning),
    );
    assert.deepEqual(warnings, []);
    assert.deepEqual([...source.data], before);
    assert.equal(backup.localStorage[APPEARANCE_KEY], preference);
    const destination = new Store();
    destination.data.set("other-app", "unchanged");
    applyRestore(
      prepareRestore(JSON.parse(JSON.stringify(backup))),
      destination,
      new Store(),
    );
    assert.deepEqual(
      Object.fromEntries(
        [...destination.data].filter(([key]) => key !== "other-app"),
      ),
      Object.fromEntries(source.data),
    );
    assert.equal(destination.getItem("other-app"), "unchanged");
  }
});

test("old backups do not reset an existing appearance preference or create one when absent", () => {
  const old = { ...completeStorage };
  delete old[APPEARANCE_KEY as keyof typeof old];
  for (const existing of [undefined, "light"]) {
    const b = browser(existing);
    applyRestore(prepareRestore(old), b.storage, new Store());
    assert.equal(b.storage.getItem(APPEARANCE_KEY), existing ?? null);
  }
});

test("malformed appearance backups and caller-supplied restore plans fail before writes", () => {
  for (const value of ["", "auto", "LIGHT", '"dark"']) {
    const storage = new Store();
    storage.data.set(APPEARANCE_KEY, "system");
    const before = [...storage.data];
    assert.throws(
      () =>
        prepareRestore({
          fitcircle_username: "changed",
          [APPEARANCE_KEY]: value,
        }),
      /Invalid appearance/,
    );
    assert.throws(
      () =>
        applyRestore(
          { entries: { [APPEARANCE_KEY]: value }, ignoredKeys: [] },
          storage,
          new Store(),
        ),
      /Invalid appearance/,
    );
    assert.deepEqual([...storage.data], before);
  }
});

test("malformed optional appearance never blocks a full export, changes source bytes or contaminates its manifest", async () => {
  for (const invalid of ["auto", "", "LIGHT", '"dark"']) {
    const source = new Store();
    for (const [key, raw] of Object.entries(completeStorage))
      source.data.set(key, raw);
    source.data.set(APPEARANCE_KEY, invalid);
    const before = [...source.data];
    const warnings: string[] = [];
    const backup = await createBackup(source, new IDBFactory(), (warning) =>
      warnings.push(warning),
    );
    assert.deepEqual([...source.data], before);
    assert.equal(source.getItem(APPEARANCE_KEY), invalid);
    assert.equal(source.writes, 0);
    const expected = Object.fromEntries(
      before.filter(([key]) => key !== APPEARANCE_KEY),
    );
    assert.deepEqual({ ...backup.localStorage }, expected);
    assert.deepEqual(
      backup.manifest!.localStorageKeys,
      Object.keys(expected).sort(),
    );
    assert.equal(backup.version, 2);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /appearance preference omitted/);
    const restored = new Store();
    applyRestore(
      prepareRestore(JSON.parse(JSON.stringify(backup))),
      restored,
      new Store(),
    );
    assert.deepEqual(Object.fromEntries(restored.data), expected);
    const invalidRestore = {
      ...backup,
      localStorage: { ...backup.localStorage, [APPEARANCE_KEY]: invalid },
      manifest: undefined,
    };
    assert.throws(() => prepareRestore(invalidRestore), /Invalid appearance/);
    assert.deepEqual([...source.data], before);
  }
});

test("the export exception never hides invalid fitness records or announces a failed export as successful", async () => {
  const source = new Store();
  source.data.set(APPEARANCE_KEY, "auto");
  source.data.set("fitcircle_hydration_data", "{broken");
  const before = [...source.data];
  const warnings: string[] = [];
  await assert.rejects(
    createBackup(source, new IDBFactory(), (warning) => warnings.push(warning)),
    /Invalid JSON/,
  );
  assert.deepEqual([...source.data], before);
  assert.deepEqual(warnings, []);
});
