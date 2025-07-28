import type { Supplement } from '@shared/schema';

interface LocalSupplement {
  id: number;
  name: string;
  measurementType: string;
  amount: number;
  createdAt: string;
}

export function useSupplements() {
  // Get supplements from localStorage
  const getSupplements = (): LocalSupplement[] => {
    const stored = localStorage.getItem('fitcircle_supplements');
    return stored ? JSON.parse(stored) : [];
  };

  // Create supplement
  const createSupplement = (supplement: { name: string; measurementType: string; amount: number }) => {
    const supplements = getSupplements();
    const newId = supplements.length > 0 ? Math.max(...supplements.map(s => s.id)) + 1 : 1;
    const newSupplement: LocalSupplement = {
      id: newId,
      name: supplement.name,
      measurementType: supplement.measurementType,
      amount: supplement.amount,
      createdAt: new Date().toISOString(),
    };
    
    const updatedSupplements = [...supplements, newSupplement];
    localStorage.setItem('fitcircle_supplements', JSON.stringify(updatedSupplements));
    return newSupplement;
  };

  // Helper functions for supplement logs
  const getSupplementLogs = (): Record<string, Record<number, boolean>> => {
    const stored = localStorage.getItem('fitcircle_supplement_logs');
    return stored ? JSON.parse(stored) : {};
  };

  const setSupplementLog = (date: string, supplementId: number, taken: boolean) => {
    const logs = getSupplementLogs();
    if (!logs[date]) logs[date] = {};
    logs[date][supplementId] = taken;
    localStorage.setItem('fitcircle_supplement_logs', JSON.stringify(logs));
  };

  const getSupplementLogsForDate = (date: string): Record<number, boolean> => {
    const logs = getSupplementLogs();
    return logs[date] || {};
  };

  const hasSupplementsForDate = (date: string): boolean => {
    const logs = getSupplementLogsForDate(date);
    return Object.values(logs).some(taken => taken);
  };

  // Calculate supplement statistics
  const getSupplementStats = () => {
    const logs = getSupplementLogs();
    const allDates = Object.keys(logs).sort();
    
    if (allDates.length === 0) {
      return {
        adherencePercentage: 0,
        currentStreak: 0,
        totalTaken: 0,
        firstLogDate: null,
      };
    }

    const firstLogDate = allDates[0];
    
    // Calculate total supplements taken
    let totalTaken = 0;
    let totalExpected = 0;
    
    // Calculate current streak (consecutive days with at least one supplement)
    let currentStreak = 0;
    const reversedDates = [...allDates].reverse();
    
    for (const date of reversedDates) {
      const dayLogs = logs[date];
      const hasTakenAny = Object.values(dayLogs).some(taken => taken);
      
      if (hasTakenAny) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate adherence from first log date
    for (const date of allDates) {
      const dayLogs = logs[date];
      const supplementsForDay = Object.keys(dayLogs).length;
      const takenForDay = Object.values(dayLogs).filter(taken => taken).length;
      
      totalTaken += takenForDay;
      totalExpected += supplementsForDay;
    }

    const adherencePercentage = totalExpected > 0 ? (totalTaken / totalExpected) * 100 : 0;

    return {
      adherencePercentage: Math.round(adherencePercentage),
      currentStreak,
      totalTaken,
      firstLogDate,
    };
  };

  return {
    supplements: getSupplements(),
    createSupplement,
    getSupplementLogs,
    setSupplementLog,
    getSupplementLogsForDate,
    hasSupplementsForDate,
    getSupplementStats,
  };
}