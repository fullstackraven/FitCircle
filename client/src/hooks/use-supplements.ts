import type { Supplement } from '@shared/schema';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';
import { getTodayString } from '@/lib/date-utils';

interface LocalSupplement {
  id: number;
  name: string;
  measurementType: string;
  amount: number;
  createdAt: string;
}

export function useSupplements() {
  // Get supplements from localStorage
  const getSupplements = (): LocalSupplement[] => 
    safeParseJSON(localStorage.getItem(STORAGE_KEYS.SUPPLEMENTS), []);

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
    try {
      localStorage.setItem(STORAGE_KEYS.SUPPLEMENTS, JSON.stringify(updatedSupplements));
    } catch (error) {
      console.error('Failed to save supplement:', error);
    }
    return newSupplement;
  };

  // Edit supplement
  const editSupplement = (id: number, updates: { name?: string; measurementType?: string; amount?: number }) => {
    const supplements = getSupplements();
    const updatedSupplements = supplements.map(supplement => 
      supplement.id === id ? { ...supplement, ...updates } : supplement
    );
    try {
      localStorage.setItem(STORAGE_KEYS.SUPPLEMENTS, JSON.stringify(updatedSupplements));
    } catch (error) {
      console.error('Failed to save supplement update:', error);
    }
    return updatedSupplements.find(s => s.id === id);
  };

  // Delete supplement
  const deleteSupplement = (id: number) => {
    const supplements = getSupplements();
    const updatedSupplements = supplements.filter(supplement => supplement.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.SUPPLEMENTS, JSON.stringify(updatedSupplements));
    } catch (error) {
      console.error('Failed to save supplement deletion:', error);
    }
    
    // Also remove all logs for this supplement to clean up data
    const logs = getSupplementLogs();
    const updatedLogs = { ...logs };
    
    Object.keys(updatedLogs).forEach(date => {
      if (updatedLogs[date][id] !== undefined) {
        delete updatedLogs[date][id];
        // If no supplements left for this date, remove the date entry
        if (Object.keys(updatedLogs[date]).length === 0) {
          delete updatedLogs[date];
        }
      }
    });
    
    try {
      localStorage.setItem('fitcircle_supplement_logs', JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('Failed to save supplement logs:', error);
    }
    return true;
  };

  // Helper functions for supplement logs
  const getSupplementLogs = (): Record<string, Record<number, boolean>> => {
    const stored = localStorage.getItem('fitcircle_supplement_logs');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.warn('Failed to parse supplement logs data:', error);
        return {};
      }
    }
    return {};
  };

  const setSupplementLog = (date: string, supplementId: number, taken: boolean) => {
    const logs = getSupplementLogs();
    if (!logs[date]) logs[date] = {};
    logs[date][supplementId] = taken;
    try {
      localStorage.setItem('fitcircle_supplement_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save supplement logs:', error);
    }
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

    // Find the first date where any supplement was actually logged (not just created)
    const firstLogDate = allDates.find(date => {
      const dayLogs = logs[date];
      return Object.values(dayLogs).some(taken => taken);
    });

    if (!firstLogDate) {
      return {
        adherencePercentage: 0,
        currentStreak: 0,
        totalTaken: 0,
        firstLogDate: null,
      };
    }
    
    // Calculate total supplements taken
    let totalTaken = 0;
    let totalExpected = 0;
    
    // Calculate current streak (consecutive days with at least one supplement)
    let currentStreak = 0;
    const today = getTodayString();
    let checkDate = today;
    
    // Count backwards from today to find current streak
    while (true) {
      const dayLogs = logs[checkDate];
      if (dayLogs && Object.values(dayLogs).some(taken => taken)) {
        currentStreak++;
        // Go to previous day
        const date = new Date(checkDate);
        date.setDate(date.getDate() - 1);
        checkDate = date.toISOString().split('T')[0];
      } else {
        break;
      }
    }

    // Calculate adherence from first actual logging date (not creation date)
    const firstLogIndex = allDates.indexOf(firstLogDate);
    const relevantDates = allDates.slice(firstLogIndex);
    
    for (const date of relevantDates) {
      const dayLogs = logs[date];
      if (dayLogs && Object.keys(dayLogs).length > 0) {
        const supplementsForDay = Object.keys(dayLogs).length;
        const takenForDay = Object.values(dayLogs).filter(taken => taken).length;
        
        totalTaken += takenForDay;
        totalExpected += supplementsForDay;
      }
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
    getSupplements,
    createSupplement,
    editSupplement,
    deleteSupplement,
    getSupplementLogs,
    setSupplementLog,
    getSupplementLogsForDate,
    hasSupplementsForDate,
    getSupplementStats,
  };
}