import { format } from "date-fns";

export function useEnergyLevel() {
  const getEnergyLevel = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const energyData = localStorage.getItem('fitcircle_energy_levels');
    if (energyData) {
      const parsed = JSON.parse(energyData);
      return parsed[dateKey] || 0;
    }
    return 0;
  };

  const setEnergyLevelForDate = (date: Date, level: number) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const energyData = localStorage.getItem('fitcircle_energy_levels');
    const parsed = energyData ? JSON.parse(energyData) : {};
    parsed[dateKey] = level;
    localStorage.setItem('fitcircle_energy_levels', JSON.stringify(parsed));
  };

  const hasEnergyLevel = (date: Date) => {
    return getEnergyLevel(date) > 0;
  };

  const getEnergyLevelData = () => {
    const energyData = localStorage.getItem('fitcircle_energy_levels');
    return energyData ? JSON.parse(energyData) : {};
  };

  return {
    getEnergyLevel,
    setEnergyLevelForDate,
    hasEnergyLevel,
    getEnergyLevelData
  };
}