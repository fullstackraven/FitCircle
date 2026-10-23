/** Phase 1 infrastructure only. Production remains dark until route conversion is approved. */
export const APPEARANCE_KEY = "fitcircle_appearance";
export type AppearancePreference = "dark" | "light" | "system";
export type Appearance = "dark" | "light";
export function isAppearancePreference(
  value: unknown,
): value is AppearancePreference {
  return value === "dark" || value === "light" || value === "system";
}
export function resolveAppearance(
  preference: unknown,
  systemDark: boolean,
): Appearance {
  return preference === "light" || (preference === "system" && !systemDark)
    ? "light"
    : "dark";
}
export interface AppearanceSnapshot {
  preference: AppearancePreference;
  resolved: Appearance;
  applied: Appearance;
  error: string | null;
}

export function startAppearanceController({
  browser = window,
  allowPreview = false,
}: { browser?: Window; allowPreview?: boolean } = {}) {
  const media = browser.matchMedia("(prefers-color-scheme: dark)");
  const root = browser.document.documentElement;
  const subscribers = new Set<() => void>();
  let stopped = false;
  let snapshot: AppearanceSnapshot = {
    preference: "dark",
    resolved: "dark",
    applied: "dark",
    error: null,
  };
  const publish = (preference: AppearancePreference, error: string | null) => {
    const resolved = resolveAppearance(preference, media.matches);
    const applied = allowPreview ? resolved : "dark";
    if (root.dataset.appearance !== applied) root.dataset.appearance = applied;
    const next = { preference, resolved, applied, error };
    if (JSON.stringify(next) !== JSON.stringify(snapshot)) {
      snapshot = next;
      subscribers.forEach((listener) => listener());
    }
  };
  const reload = () => {
    if (stopped) return;
    try {
      const raw = browser.localStorage.getItem(APPEARANCE_KEY);
      // Invalid bytes are left untouched; only an explicit, successful save replaces them.
      publish(isAppearancePreference(raw) ? raw : "dark", null);
    } catch {
      publish("dark", "Appearance preference could not be read.");
    }
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === APPEARANCE_KEY || event.key === null) reload();
  };
  const onSystemChange = () => {
    if (snapshot.preference === "system")
      publish(snapshot.preference, snapshot.error);
  };
  browser.addEventListener("storage", onStorage);
  browser.addEventListener("pageshow", reload);
  media.addEventListener("change", onSystemChange);
  reload();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      subscribers.add(listener);
      return () => {
        subscribers.delete(listener);
      };
    },
    setPreference(value: unknown): { ok: boolean; error?: string } {
      if (stopped)
        return { ok: false, error: "Appearance controller is stopped." };
      if (!isAppearancePreference(value))
        return { ok: false, error: "Invalid appearance preference." };
      try {
        browser.localStorage.setItem(APPEARANCE_KEY, value);
      } catch {
        const error = "Appearance preference could not be saved.";
        publish(snapshot.preference, error);
        return { ok: false, error };
      }
      publish(value, null);
      return { ok: true };
    },
    stop() {
      stopped = true;
      browser.removeEventListener("storage", onStorage);
      browser.removeEventListener("pageshow", reload);
      media.removeEventListener("change", onSystemChange);
      subscribers.clear();
    },
  };
}
