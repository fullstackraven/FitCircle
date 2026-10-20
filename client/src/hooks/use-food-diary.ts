import { useEffect, useState } from "react";
import type { FoodEntry } from "@/lib/local-food-service";
import { readFoodDay, saveFoodDay } from "@/lib/food-diary";
export function useFoodDiary(date: string) {
  const [state, setState] = useState<{
    date: string;
    raw: string | null;
    entries: FoodEntry[];
    error: string;
  }>({ date: "", raw: null, entries: [], error: "" });
  const load = () => {
    try {
      setState({ date, ...readFoodDay(date), error: "" });
    } catch {
      setState({
        date,
        raw: null,
        entries: [],
        error:
          "This day’s food data could not be read safely. Original records are unchanged. Retry or restore a verified backup in Settings.",
      });
    }
  };
  useEffect(load, [date]);
  const commit = (entries: FoodEntry[]) => {
    setSaveError("");
    try {
      if (state.date !== date || state.error)
        throw new Error("Load this day safely before saving.");
      const raw = saveFoodDay(date, entries, state.raw);
      setState({ date, raw, entries, error: "" });
      return true;
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not save. Your previous records are unchanged.",
      );
      return false;
    }
  };
  const [saveError, setSaveError] = useState("");
  return {
    entries: state.date === date ? state.entries : [],
    error: state.date === date ? state.error : "",
    ready: state.date === date && !state.error,
    commit,
    retry: () => {
      setSaveError("");
      load();
    },
    saveError,
    clearError: () => setSaveError(""),
  };
}
