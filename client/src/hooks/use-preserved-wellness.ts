import { STORAGE_KEYS } from "@/lib/storage-utils";
import { useEffect, useRef, useState } from "react";
export const WELLNESS_CHANGED = "fitcircleWellnessChanged";
/** Explicit, single-record writes only. Rendering and midnight never persist projections. */
export function usePreservedWellness<T>(
  key:
    | typeof STORAGE_KEYS.HYDRATION
    | typeof STORAGE_KEYS.MEDITATION
    | typeof STORAGE_KEYS.FASTING,
  fallback: T,
  valid: (value: any) => boolean,
) {
  const load = () => {
    try {
      const raw = localStorage.getItem(key);
      const data = raw === null ? fallback : JSON.parse(raw);
      if (!valid(data)) throw Error("Unexpected record shape");
      return { raw, data: data as T, error: "" };
    } catch {
      return {
        raw: undefined,
        data: fallback,
        error:
          "Saved records could not be read safely. Original data is unchanged. Restore a verified backup in Settings.",
      };
    }
  };
  const [state, setState] = useState(load);
  const latest = useRef(state);
  latest.current = state;
  useEffect(() => {
    const refresh = () => {
      const next = load();
      latest.current = next;
      setState(next);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) refresh();
    };
    const onLocal = () => {
      try {
        if (latest.current.raw !== localStorage.getItem(key)) refresh();
      } catch {
        refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(WELLNESS_CHANGED, onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(WELLNESS_CHANGED, onLocal);
    };
  }, [key]);
  const change = (update: (data: T) => T) => {
    try {
      const previous = latest.current;
      if (previous.error || previous.raw === undefined)
        throw Error(previous.error);
      if (localStorage.getItem(key) !== previous.raw)
        throw Error(
          "Records changed in another window. Reload before editing.",
        );
      const data = update(previous.data),
        raw = JSON.stringify(data);
      localStorage.setItem(key, raw);
      const next = { data, raw, error: "" };
      latest.current = next;
      setState(next);
      window.dispatchEvent(new Event(WELLNESS_CHANGED));
      return true;
    } catch (error) {
      const next = {
        ...latest.current,
        error: (error as Error).message || "Could not save records.",
      };
      latest.current = next;
      setState(next);
      return false;
    }
  };
  return { data: state.data, change, error: state.error };
}
export function useWellnessClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = setInterval(refresh, 60_000);
    let midnight: ReturnType<typeof setTimeout>;
    const scheduleMidnight = () => {
      const current = new Date(),
        next = new Date(current);
      next.setHours(24, 0, 0, 0);
      midnight = setTimeout(
        () => {
          refresh();
          scheduleMidnight();
        },
        Math.max(1, next.getTime() - current.getTime() + 1),
      );
    };
    scheduleMidnight();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener(WELLNESS_CHANGED, refresh);
    return () => {
      clearInterval(timer);
      clearTimeout(midnight);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener(WELLNESS_CHANGED, refresh);
    };
  }, []);
  return now;
}
