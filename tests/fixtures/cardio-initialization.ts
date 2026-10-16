// Isolated synthetic history only; never use an installed app's records.
export const cardioKey = 'fitcircle_cardio_data';
export const cardioLegacyKeys = ['fitcircle_cardio', 'cardioLogs', 'cardio_entries', 'cardio'] as const;
export const cardioGoalKey = 'fitcircle_goal_cardio';
export const modernCardio = {
  dailyLogs: {
    '2025-03-02': { date: '2025-03-02', totalDuration: 25.5, totalDistance: 2.25,
      sessions: [{ id: 'synthetic-run', time: '06:18 AM', type: 'running', duration: 25.5, distance: 2.25, notes: 'Synthetic notes', extra: 'retain session metadata' }] },
    '2025-03-04': { date: '2025-03-04', totalDuration: 0, totalDistance: 0, sessions: [] },
  },
  goal: { type: 'duration', target: 150, period: 'week', extra: 'retain goal metadata' },
  goalUserSet: true, customTypes: ['Synthetic climb'], lastDate: '2025-03-04', currentDayDuration: 0, currentDayDistance: 0,
  extra: { original: true },
};
export const legacyCardio = [
  { id: 'synthetic-old', date: '2025-03-02', type: 'walking', duration: '12.5', distance: '1.25', timestamp: 1740916800000, notes: 'Synthetic legacy', extra: 'retain entry metadata' },
  { id: 'synthetic-zero', date: '2025-03-02', type: 'walking', duration: 0, distance: 0, timestamp: 1740916800000 },
];
export const malformedCardio = [
  { name: 'truncated JSON', raw: ' {"dailyLogs": ' },
  { name: 'empty bytes', raw: '' },
  ...[null, false, 3, 'unexpected', [], {}, { goal: modernCardio.goal },
    { ...modernCardio, dailyLogs: null }, { ...modernCardio, dailyLogs: [] },
    { ...modernCardio, dailyLogs: { x: { date: '2025-03-02', totalDuration: 5, totalDistance: 0, sessions: null } } },
    { ...modernCardio, goal: { type: 'duration', target: '150' } },
    { ...modernCardio, goal: { type: 'duration', target: 30, period: 'month' } },
    { ...modernCardio, customTypes: [null] }, { ...modernCardio, goalUserSet: 'false' },
    { ...modernCardio, currentDayDuration: '25' },
    { entries: [null] }, { entries: [{ date: '2025-03-02', type: 'walking', duration: 'bad' }] },
    { entries: [{ type: 'walking', duration: 10 }] },
    { entries: [{ date: '2025-03-02', type: 'walking', duration: 10, distance: 'bad' }] },
  ].map((value, i) => ({ name: `unexpected or incomplete shape ${i}`, raw: JSON.stringify(value) })),
];
