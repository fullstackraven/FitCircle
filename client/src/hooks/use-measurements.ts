import { useEffect, useRef, useState } from "react";
import { getTodayString } from "@/lib/date-utils";
import {
  measurementKeys,
  readMeasurementRecord,
  recordedPoints,
  saveMeasurements,
  INTEGRATION_CHANGED,
  type MeasurementKind,
} from "@/lib/measurement-integration";
export interface MeasurementEntry {
  date: string;
  value: number;
}
export type MeasurementData = Record<MeasurementKind, MeasurementEntry[]>;
const empty = () =>
  Object.fromEntries(
    measurementKeys.map((key) => [key, [] as MeasurementEntry[]]),
  ) as MeasurementData;
function load() {
  try {
    const { raw, record } = readMeasurementRecord();
    return {
      raw,
      data: { ...empty(), ...record } as MeasurementData,
      error: "",
    };
  } catch (failure) {
    return { raw: undefined, data: empty(), error: (failure as Error).message };
  }
}
export function useMeasurements() {
  const [state, setState] = useState(load);
  const expected = useRef(state.raw);
  useEffect(() => {
    const refresh = () => setState(load());
    window.addEventListener("storage", refresh);
    window.addEventListener(INTEGRATION_CHANGED, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(INTEGRATION_CHANGED, refresh);
    };
  }, []);
  const addMeasurements = (
    patch: Partial<Record<MeasurementKind, number>>,
    date = getTodayString(),
  ) => {
    if (state.error || expected.current === undefined)
      throw Error(state.error || "Reload measurements before editing.");
    const next = saveMeasurements(patch, date, localStorage, expected.current);
    expected.current = localStorage.getItem("fitcircle_measurements_history");
    setState({
      data: { ...empty(), ...next } as MeasurementData,
      raw: expected.current,
      error: "",
    });
  };
  const points = (type: MeasurementKind) =>
    recordedPoints(state.data, type).map((point) => ({
      date: point.date!,
      value: point.value,
    }));
  const getLatestValue = (type: MeasurementKind) =>
    points(type).at(-1)?.value ?? null;
  const getValueTrend = (type: MeasurementKind): "up" | "down" | "neutral" => {
    const list = points(type);
    if (list.length < 2) return "neutral";
    return list.at(-1)!.value > list.at(-2)!.value
      ? "up"
      : list.at(-1)!.value < list.at(-2)!.value
        ? "down"
        : "neutral";
  };
  return {
    data: state.data,
    error: state.error,
    addMeasurements,
    addMeasurement: (type: MeasurementKind, value: number, date?: string) =>
      addMeasurements({ [type]: value }, date),
    getLatestValue,
    getValueTrend,
    getChartData: (type: MeasurementKind, days?: number) => {
      const list = points(type);
      if (days === undefined) return list;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return list.filter(
        (entry) => new Date(entry.date + "T12:00:00") >= cutoff,
      );
    },
  };
}
