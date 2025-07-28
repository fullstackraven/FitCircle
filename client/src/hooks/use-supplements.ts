import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Supplement, SupplementLog, InsertSupplement } from '@shared/schema';

export function useSupplements() {
  const queryClient = useQueryClient();

  // Fetch all supplements
  const { data: supplements = [], isLoading: supplementsLoading } = useQuery<Supplement[]>({
    queryKey: ['/api/supplements'],
  });

  // Create supplement mutation
  const createSupplementMutation = useMutation({
    mutationFn: async (supplement: InsertSupplement) => {
      const res = await apiRequest('POST', '/api/supplements', supplement);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supplements'] });
    },
  });

  // Supplement log mutations
  const logSupplementMutation = useMutation({
    mutationFn: async ({ supplementId, date, taken }: { supplementId: number; date: string; taken: boolean }) => {
      const res = await apiRequest('POST', '/api/supplement-logs', { supplementId, date, taken });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supplement-logs'] });
    },
  });

  // Helper functions for local storage based operations (similar to workouts)
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
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
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
    supplements,
    supplementsLoading,
    createSupplement: createSupplementMutation.mutate,
    isCreatingSupplement: createSupplementMutation.isPending,
    logSupplement: logSupplementMutation.mutate,
    isLoggingSupplement: logSupplementMutation.isPending,
    
    // Local storage helpers
    getSupplementLogs,
    setSupplementLog,
    getSupplementLogsForDate,
    hasSupplementsForDate,
    getSupplementStats,
  };
}