import { format } from "date-fns";
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';
import { getTodayString } from '@/lib/date-utils';

export function useEnergyLevel() {
  const getEnergyLevel = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const parsed = safeParseJSON(localStorage.getItem('fitcircle_energy_levels'), {});
    return parsed[dateKey] || 0;
  };

  const setEnergyLevelForDate = (date: Date, level: number) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const parsed: { [key: string]: number } = safeParseJSON(localStorage.getItem('fitcircle_energy_levels'), {});
    parsed[dateKey] = level;
    
    try {
      localStorage.setItem('fitcircle_energy_levels', JSON.stringify(parsed));
    } catch (error) {
      console.error('Failed to save energy levels data:', error);
    }
  };

  const hasEnergyLevel = (date: Date) => {
    return getEnergyLevel(date) > 0;
  };

  const getEnergyLevelData = () => {
    return safeParseJSON(localStorage.getItem('fitcircle_energy_levels'), {});
  };

  return {
    getEnergyLevel,
    setEnergyLevelForDate,
    hasEnergyLevel,
    getEnergyLevelData
  };
}