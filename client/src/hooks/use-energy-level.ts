import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';
import { getDateString } from '@/lib/date-utils';

export function useEnergyLevel() {
  const getEnergyLevel = (date: Date) => {
    const dateKey = getDateString(date);
    const parsed = safeParseJSON(localStorage.getItem(STORAGE_KEYS.ENERGY_LEVELS), {});
    return parsed[dateKey] || 0;
  };

  const setEnergyLevelForDate = (date: Date, level: number) => {
    const dateKey = getDateString(date);
    const parsed: { [key: string]: number } = safeParseJSON(localStorage.getItem(STORAGE_KEYS.ENERGY_LEVELS), {});
    parsed[dateKey] = level;
    
    try {
      localStorage.setItem(STORAGE_KEYS.ENERGY_LEVELS, JSON.stringify(parsed));
    } catch (error) {
      console.error('Failed to save energy levels data:', error);
    }
  };

  const hasEnergyLevel = (date: Date) => {
    return getEnergyLevel(date) > 0;
  };

  const getEnergyLevelData = () => {
    return safeParseJSON(localStorage.getItem(STORAGE_KEYS.ENERGY_LEVELS), {});
  };

  return {
    getEnergyLevel,
    setEnergyLevelForDate,
    hasEnergyLevel,
    getEnergyLevelData
  };
}