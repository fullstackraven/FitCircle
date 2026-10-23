// Shared color utilities for consistent theming across the app

export const colorClassMap: { [key: string]: string } = {
  green: 'workout-green',
  blue: 'workout-blue',
  purple: 'workout-purple',
  amber: 'workout-amber',
  red: 'workout-red',
  pink: 'workout-pink',
  cyan: 'workout-cyan',
  lime: 'workout-lime',
  orange: 'workout-orange',
  indigo: 'workout-indigo',
  emerald: 'workout-emerald',
  yellow: 'workout-yellow'
};

export const strokeColorMap: { [key: string]: string } = {
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  amber: '#f59e0b',
  red: '#ef4444',
  pink: '#ec4899',
  cyan: '#06b6d4',
  lime: '#84cc16',
  orange: '#f97316',
  indigo: '#6366f1',
  emerald: '#10b981',
  yellow: '#eab308'
};

// Heat-based color mapping for fasting and other intensity-based features
export const getHeatRingColor = (value: number, maxValue: number = 24): string => {
  const ratio = Math.min(value / maxValue, 1);
  
  if (ratio >= 0.9) return '#dc2626'; // red-600 - extreme
  if (ratio >= 0.75) return '#ea580c'; // orange-600 - high
  if (ratio >= 0.5) return '#f59e0b'; // amber-500 - medium
  if (ratio >= 0.25) return '#22c55e'; // green-500 - low
  return '#6b7280'; // gray-500 - minimal
};

export const getHeatBarColor = (value: number, maxValue: number = 24): string => {
  // Same logic as ring color but could be customized differently if needed
  return getHeatRingColor(value, maxValue);
};

// Get CSS class for a given color name
export const getColorClass = (color: string): string => {
  return colorClassMap[color] || 'workout-green';
};

// Get stroke color for a given color name
export const getStrokeColor = (color: string): string => {
  return strokeColorMap[color] || '#22c55e';
};
/** Presentation only: preserve persisted hue identifiers and Dark strokes. */
const lightStrokeColorMap: Record<string, string> = {
  green: '#15803d', blue: '#1d4ed8', purple: '#6d28d9', amber: '#b45309',
  red: '#b91c1c', pink: '#be185d', cyan: '#0e7490', lime: '#4d7c0f',
  orange: '#c2410c', indigo: '#4338ca', emerald: '#047857', yellow: '#a16207',
};
export const getLightStrokeColor = (color: string): string => lightStrokeColorMap[color] || lightStrokeColorMap.green;
