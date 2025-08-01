import { useState, useEffect } from 'react';
import { getTodayString } from '@/lib/date-utils';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';

export interface MeasurementEntry {
  date: string;
  value: number;
}

export interface MeasurementData {
  weight: MeasurementEntry[];
  height: MeasurementEntry[];
  bodyFat: MeasurementEntry[];
  neck: MeasurementEntry[];
  chest: MeasurementEntry[];
  waist: MeasurementEntry[];
  hips: MeasurementEntry[];
  bicepLeft: MeasurementEntry[];
  bicepRight: MeasurementEntry[];
  forearmLeft: MeasurementEntry[];
  forearmRight: MeasurementEntry[];
  thighLeft: MeasurementEntry[];
  thighRight: MeasurementEntry[];
  calfLeft: MeasurementEntry[];
  calfRight: MeasurementEntry[];
}

export function useMeasurements() {
  const [data, setData] = useState<MeasurementData>(() => 
    safeParseJSON(localStorage.getItem(STORAGE_KEYS.MEASUREMENTS), {
      weight: [],
      height: [],
      bodyFat: [],
      neck: [],
      chest: [],
      waist: [],
      hips: [],
      bicepLeft: [],
      bicepRight: [],
      forearmLeft: [],
      forearmRight: [],
      thighLeft: [],
      thighRight: [],
      calfLeft: [],
      calfRight: []
    })
  );

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(data));
  }, [data]);

  const addMeasurement = (type: keyof MeasurementData, value: number, date?: string) => {
    const measurementDate = date || getTodayString();
    
    setData(prev => ({
      ...prev,
      [type]: [
        ...prev[type].filter(entry => entry.date !== measurementDate), // Remove existing entry for this date
        { date: measurementDate, value }
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }));

    // Also update the individual localStorage keys for backward compatibility
    const keyMap: { [key in keyof MeasurementData]: string } = {
      weight: 'fitcircle_weight',
      height: 'fitcircle_height',
      bodyFat: 'fitcircle_body_fat',
      neck: 'fitcircle_neck',
      chest: 'fitcircle_chest',
      waist: 'fitcircle_waist',
      hips: 'fitcircle_hips',
      bicepLeft: 'fitcircle_bicep_left',
      bicepRight: 'fitcircle_bicep_right',
      forearmLeft: 'fitcircle_forearm_left',
      forearmRight: 'fitcircle_forearm_right',
      thighLeft: 'fitcircle_thigh_left',
      thighRight: 'fitcircle_thigh_right',
      calfLeft: 'fitcircle_calf_left',
      calfRight: 'fitcircle_calf_right'
    };

    localStorage.setItem(keyMap[type], value.toString());
  };

  const getLatestValue = (type: keyof MeasurementData): number | null => {
    const entries = data[type];
    if (entries.length === 0) return null;
    return entries[entries.length - 1].value;
  };

  const getValueTrend = (type: keyof MeasurementData): 'up' | 'down' | 'neutral' => {
    const entries = data[type];
    if (entries.length < 2) return 'neutral';
    
    const latest = entries[entries.length - 1].value;
    const previous = entries[entries.length - 2].value;
    
    if (latest > previous) return 'up';
    if (latest < previous) return 'down';
    return 'neutral';
  };

  const getChartData = (type: keyof MeasurementData, days: number = 30) => {
    const entries = data[type];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return entries.filter(entry => new Date(entry.date) >= cutoffDate);
  };

  return {
    data,
    addMeasurement,
    getLatestValue,
    getValueTrend,
    getChartData
  };
}