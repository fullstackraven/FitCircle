/** Read-only presentation. Never use these strings for calculations or persistence. */
const calories = new Intl.NumberFormat('en-US', { useGrouping: false, maximumFractionDigits: 0 });
const macros = new Intl.NumberFormat('en-US', { useGrouping: false, maximumFractionDigits: 1 });
export function formatNutritionDisplay(value: unknown, kind: 'calories' | 'macro' = 'macro'): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 'Unknown';
  return (kind === 'calories' ? calories : macros).format(value === 0 ? 0 : value);
}
