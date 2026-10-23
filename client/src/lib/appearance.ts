/** Shared production/development appearance controller; no default storage writes. */
export const APPEARANCE_KEY = "fitcircle_appearance";
export type AppearancePreference = "dark" | "light" | "system";
export type Appearance = "dark" | "light";
// Match the established app-background palette and the tiny pre-bundle bootstrap.
export const APPEARANCE_COLORS = { dark: "#0f172a", light: "#f8fafc" } as const;
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
}: { browser?: Window } = {}) {
  let media: MediaQueryList | undefined;
  try {
    media = browser.matchMedia?.("(prefers-color-scheme: dark)");
  } catch {
    /* System falls back to Dark. */
  }
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
    const resolved = resolveAppearance(preference, media?.matches !== false);
    const applied = resolved;
    if (root.dataset.appearance !== applied) root.dataset.appearance = applied;
    root.style.colorScheme = applied;
    browser.document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", APPEARANCE_COLORS[applied]);
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
  const onVisible = () => {
    if (browser.document.visibilityState !== "hidden") reload();
  };
  browser.addEventListener("storage", onStorage);
  browser.addEventListener("pageshow", reload);
  browser.addEventListener("focus", reload);
  browser.document.addEventListener("visibilitychange", onVisible);
  if (media?.addEventListener) media.addEventListener("change", onSystemChange);
  else media?.addListener?.(onSystemChange);
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
      browser.removeEventListener("focus", reload);
      browser.document.removeEventListener("visibilitychange", onVisible);
      if (media?.removeEventListener)
        media.removeEventListener("change", onSystemChange);
      else media?.removeListener?.(onSystemChange);
      subscribers.clear();
    },
  };
}

// Started exactly once by main.tsx, after interrupted-restore recovery. Importing
// this module (including from backup validation) never reads browser storage.
let applicationController:
  | ReturnType<typeof startAppearanceController>
  | undefined;
export function initializeAppearance() {
  return (applicationController ??= startAppearanceController());
}
export function getAppearanceController() {
  if (!applicationController)
    throw new Error("Appearance has not initialized.");
  return applicationController;
}
