/**
 * Unified color system for FitCircle app
 * All workout color definitions and mappings centralized here
 */

// Color name to CSS class mapping (for legacy compatibility)
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
  yellow: 'workout-yellow',
  gray: 'workout-gray',
  teal: 'workout-teal'
};

export const WORKOUT_COLORS = [
  'workout-blue',
  'workout-green', 
  'workout-red',
  'workout-purple',
  'workout-pink',
  'workout-cyan',
  'workout-gray',
  'workout-teal',
  'workout-lime',
  'workout-orange',
  'workout-indigo',
  'workout-emerald',
  'workout-yellow'
] as const;

export type WorkoutColor = typeof WORKOUT_COLORS[number];

/**
 * Unified color class mapping for all workout-related UI components
 * Maps workout color names to Tailwind CSS classes
 */
export const colorClassMapNew: Record<WorkoutColor, string> = {
  'workout-blue': 'bg-blue-500',
  'workout-green': 'bg-green-500',
  'workout-red': 'bg-red-500', 
  'workout-purple': 'bg-purple-500',
  'workout-pink': 'bg-pink-500',
  'workout-cyan': 'bg-cyan-500',
  'workout-gray': 'bg-gray-500',
  'workout-teal': 'bg-teal-500',
  'workout-lime': 'bg-lime-500',
  'workout-orange': 'bg-orange-500',
  'workout-indigo': 'bg-indigo-500',
  'workout-emerald': 'bg-emerald-500',
  'workout-yellow': 'bg-yellow-500'
};

/**
 * CSS class to hex color mapping
 */
export const colorHexMap: { [key: string]: string } = {
  'workout-blue': '#3b82f6',
  'workout-green': '#22c55e', 
  'workout-red': '#ef4444',
  'workout-purple': '#a855f7',
  'workout-pink': '#ec4899',
  'workout-cyan': '#06b6d4',
  'workout-gray': '#6b7280',
  'workout-teal': '#14b8a6',
  'workout-lime': '#84cc16',
  'workout-orange': '#f97316',
  'workout-indigo': '#6366f1',
  'workout-emerald': '#10b981',
  'workout-yellow': '#eab308',
  'workout-amber': '#f59e0b'
};

/**
 * Validates if a string is a valid workout color
 */
export function isValidWorkoutColor(color: string): color is WorkoutColor {
  return WORKOUT_COLORS.includes(color as WorkoutColor);
}

/**
 * Gets a safe workout color, defaults to blue if invalid
 */
export function getSafeWorkoutColor(color: string): WorkoutColor {
  return isValidWorkoutColor(color) ? color : 'workout-blue';
}

/**
 * Gets the CSS class for a workout color
 */
export function getWorkoutColorClass(color: WorkoutColor): string {
  return colorClassMapNew[color];
}

/**
 * Helper function to get hex color from color name
 */
export function getColorHex(colorName: string): string {
  const className = colorClassMap[colorName];
  return className ? colorHexMap[className] || '#6b7280' : '#6b7280';
}