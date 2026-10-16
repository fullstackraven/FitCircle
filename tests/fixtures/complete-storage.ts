// Synthetic records only. Explicit feature fixtures deliberately do not derive
// values from validators: a newly registered source must add its fixture here.
const date = '2026-10-15';
export const legacyFood = { id: 'legacy-oats', name: 'Saved oats', quantity: 100, unit: 'g', calories: 350, carbs: 60, protein: 12, fat: 5 };
const customFood = { ...legacyFood, id: 'custom-soup', name: 'Homemade soup', calories: 85, carbs: 10 };
const meal = { ...customFood, meal: 'lunch', timestamp: `${date}T12:15:00Z` };
const workout = { id: 'pushup', name: 'Push-ups', color: 'green', routineId: 'morning', count: 12, dailyGoal: 20, scheduledDays: [1, 3, 5], goalHistory: [{ goal: 15, timestamp: '2026-10-01T08:00:00Z' }] };
const log = { pushup: { count: 15, goalAtTime: 20 }, squat: 25 };
export const structured = {
  'workout-tracker-data': { workouts: { pushup: workout, squat: { ...workout, id: 'squat', name: 'Squats', weightLbs: 20 } }, dailyLogs: { [date]: log, '2026-10-14': { squat: 20 } }, routines: { morning: { id: 'morning', name: 'Morning strength', selectedDays: [1, 3], createdAt: '2026-10-01' } }, journalEntries: { [date]: { text: 'Feeling stronger', timestamp: `${date}T18:23:00Z` } } },
  'workout-tracker-logs': { [date]: log },
  fitcircle_food_database: [legacyFood, customFood],
  fitcircle_goal_cardio: { type: 'duration', target: 30, period: 'day' },
  fitcircle_daily_quote: { text: 'Keep going', author: 'Synthetic fixture' },
  fitcircle_deleted_builtin_foods: ['deleted-food-id'],
  fitcircle_hydration_data: { dailyGoalOz: 80, currentDayOz: 24, logs: { [date]: { date, totalOz: 24, entries: [{ time: '10:00', amount: 24 }] } }, lastDate: date },
  fitcircle_meditation_logs: { dailyLogs: { [date]: { date, totalMinutes: 10, sessions: [{ id: 'med-1', time: '08:00', duration: 10 }] } }, lastDate: date, currentDayMinutes: 10 },
  fitcircle_fasting_logs: [{ id: 'fast-1', startDate: '2026-10-14', startTime: '20:00', endDate: date, endTime: '12:00', duration: 16, loggedAt: `${date}T12:00:00Z` }],
  fitcircle_cardio_data: { dailyLogs: { [date]: { date, totalDuration: 30, totalDistance: 5, sessions: [{ id: 'run-1', time: '07:00', duration: 30, type: 'running', distance: 5 }] } }, goal: { type: 'distance', target: 5 }, customTypes: ['Hill walk'] },
  fitcircle_measurements_history: { weight: [{ date, value: 165 }, { date: '2026-10-01', value: 166 }] },
  fitcircle_measurements: { waist: 32, chest: 40 },
  fitcircle_energy_levels: { [date]: 8 },
  fitcircle_supplements: [{ id: 1, name: 'Vitamin D', measurementType: 'IU', amount: 1000, createdAt: date }],
  fitcircle_supplement_logs: { [date]: { '1': true } },
  fitcircle_reminders: [{ id: 'rem-1', text: 'Walk outdoors', completed: false, createdAt: date }, { id: 'rem-2', text: 'Water', completed: true, createdAt: date }],
  fitcircle_recovery_data: { recoveryDays: ['2026-10-13'] },
  fitcircle_workout_duration_data: { completedSessions: [{ date, startTime: 1792051200000, duration: 1800 }], currentSession: { date, startTime: 1792061200000 } },
  fitcircle_dashboard_widgets: [{ id: 'water', type: 'hydration', title: 'Water', enabled: true, position: 0, size: 'small' }],
  fitcircle_control_settings: { showQuote: false, showTimer: true },
  fitcircle_goals: { hydrationOz: 80, fastingHours: 16, targetWeight: 160, weightGoalType: 'lose' },
  fitcircle_profile: { name: 'Synthetic person', height: 70 },
  fitcircle_wellness_weights: { hydration: 2, cardio: 3 },
  fitcircle_wellness_layout: ['cardio', 'hydration', 'fasting'],
  fitcircle_trainer_messages: [{ role: 'user', content: 'Legacy message' }],
  fitcircle_notes: { [date]: 'Legacy note' },
  fitcircle_food_tracker: [meal], fitcircle_food_tracker_data: { [date]: [meal] },
  fitcircle_cardio: [], cardioLogs: [], cardio_entries: [], cardio: [],
  [`fitcircle_food_${date}`]: [meal], [`fitcircle_food_tracker${date}`]: [meal],
};
export const scalars: Record<string, string> = {
  fitcircle_username: 'Synthetic person', fitcircle_age: '37', fitcircle_weight: '165.50', fitcircle_fitness_goal: 'strength', fitcircle_weight_goal_type: 'lose', fitcircle_device_id: 'synthetic-device', fitcircle_food_database_migrated: 'true', fitcircle_auto_backup_enabled: 'false', fitcircle_last_auto_backup: '2026-10-14T20:00:00Z', fitcircle_quote_date: date, fitcircle_last_quote_index: '7', fitcircle_height: '70', fitcircle_body_fat: '20', fitcircle_neck: '15', fitcircle_chest: '40', fitcircle_waist: '32', fitcircle_hips: '38', fitcircle_bicep_left: '13', fitcircle_bicep_right: '13.5', fitcircle_forearm_left: '11', fitcircle_forearm_right: '11', fitcircle_thigh_left: '22', fitcircle_thigh_right: '22', fitcircle_calf_left: '15', fitcircle_calf_right: '15',
  fitness_calc_activity_level: 'moderate', fitness_calc_goal_type: 'lose', fitness_calc_goal_rate: '0.5', fitness_calc_macro_style: 'custom', fitness_calc_custom_carbs: '40', fitness_calc_custom_protein: '30', fitness_calc_custom_fat: '30', fitness_calc_target_calories: '2100', fitness_calc_target_carbs: '210', fitness_calc_target_protein: '157.5', fitness_calc_target_fat: '70',
  fitcircle_goal_hydration: '80', fitcircle_goal_meditation: '10', fitcircle_goal_fasting: '16', fitcircle_goal_weight: '160', fitcircle_goal_bodyfat: '18',
};
export const completeStorage = { ...Object.fromEntries(Object.entries(structured).map(([key, value]) => [key, JSON.stringify(value)])), ...scalars };
