import { useState, useEffect } from 'react';

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

const STORAGE_KEY = 'fitcircle_measurements_history';

function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useMeasurements() {
  const [data, setData] = useState<MeasurementData>({
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
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setData(parsed);
      } catch (error) {
        console.error('Failed to parse measurements history:', error);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save data to localStorage whenever it changes (but not on initial load)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isInitialized]);

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