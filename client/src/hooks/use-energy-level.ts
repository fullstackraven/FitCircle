import { format } from "date-fns";

export function useEnergyLevel() {
  const getEnergyLevel = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const energyData = localStorage.getItem('fitcircle_energy_levels');
    if (energyData) {
      try {
        const parsed = JSON.parse(energyData);
        return parsed[dateKey] || 0;
      } catch (error) {
        console.warn('Failed to parse energy levels data:', error);
        return 0;
      }
    }
    return 0;
  };

  const setEnergyLevelForDate = (date: Date, level: number) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const energyData = localStorage.getItem('fitcircle_energy_levels');
    let parsed = {};
    
    if (energyData) {
      try {
        parsed = JSON.parse(energyData);
      } catch (error) {
        console.warn('Failed to parse energy levels data, creating new:', error);
        parsed = {};
      }
    }
    
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
    const energyData = localStorage.getItem('fitcircle_energy_levels');
    if (energyData) {
      try {
        return JSON.parse(energyData);
      } catch (error) {
        console.warn('Failed to parse energy levels data:', error);
        return {};
      }
    }
    return {};
  };

  return {
    getEnergyLevel,
    setEnergyLevelForDate,
    hasEnergyLevel,
    getEnergyLevelData
  };
}