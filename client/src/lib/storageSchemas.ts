/**
 * Zod validation schemas for all localStorage data structures
 * Ensures type safety and data integrity across the application
 */

import { z } from 'zod';
import { WORKOUT_COLORS } from './colors';

// Base schemas
const DateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const WorkoutColorSchema = z.enum(WORKOUT_COLORS);

// Workout schemas
export const WorkoutSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  count: z.number().default(0),
  dailyGoal: z.number().default(0)
});

export const WorkoutsStateSchema = z.object({
  workouts: z.record(z.string(), WorkoutSchema).default({}),
  dailyLogs: z.record(DateString, z.record(z.string(), z.number())).default({}),
  journalEntries: z.record(DateString, z.string()).default({}),
  lastDate: z.string().optional(),
  lastUpdated: z.string().optional()
});

// Hydration schemas
export const HydrationEntrySchema = z.object({
  time: z.string(),
  amount: z.number().min(0),
  liquidType: z.string().default('Water')
});

export const HydrationLogSchema = z.object({
  date: z.string(),
  totalOz: z.number().min(0),
  entries: z.array(HydrationEntrySchema).default([])
});

export const HydrationStateSchema = z.object({
  dailyGoalOz: z.number().min(0).default(64),
  currentDayOz: z.number().min(0).default(0),
  logs: z.record(DateString, HydrationLogSchema).default({}),
  lastDate: z.string().default(''),
  lastUpdated: z.string().optional()
}).default({
  dailyGoalOz: 64,
  currentDayOz: 0,
  logs: {},
  lastDate: '',
  lastUpdated: undefined
});

// Fasting schemas
export const FastingStateSchema = z.object({
  logs: z.record(DateString, z.object({
    startTime: z.string(),
    endTime: z.string().optional(),
    duration: z.number().min(0).optional(),
    type: z.string().default('16:8')
  })).default({}),
  defaultType: z.string().default('16:8'),
  lastUpdated: z.string().optional()
});

// Goals schemas
export const GoalStateSchema = z.object({
  hydration: z.object({
    enabled: z.boolean().default(true),
    target: z.number().min(0).default(8),
    unit: z.string().default('glasses')
  }),
  meditation: z.object({
    enabled: z.boolean().default(true),
    target: z.number().min(0).default(10),
    unit: z.string().default('minutes')
  }),
  fasting: z.object({
    enabled: z.boolean().default(true),
    target: z.number().min(0).default(16),
    unit: z.string().default('hours')
  }),
  weight: z.object({
    enabled: z.boolean().default(false),
    target: z.number().min(0).optional(),
    unit: z.string().default('lbs')
  }),
  bodyFat: z.object({
    enabled: z.boolean().default(false),
    target: z.number().min(0).max(100).optional(),
    unit: z.string().default('%')
  }),
  lastUpdated: z.string().optional()
});

// Reminders schemas
export const ReminderSchema = z.object({
  id: z.string(),
  title: z.string(),
  time: z.string(),
  enabled: z.boolean().default(true),
  type: z.enum(['workout', 'hydration', 'meditation', 'custom']),
  workoutId: z.string().optional()
});

export const RemindersStateSchema = z.object({
  reminders: z.array(ReminderSchema).default([]),
  lastUpdated: z.string().optional()
});

// Cardio schemas
export const CardioEntrySchema = z.object({
  id: z.string(),
  type: z.string(),
  duration: z.number().min(0),
  calories: z.number().min(0).optional(),
  distance: z.number().min(0).optional(),
  notes: z.string().optional()
});

export const CardioStateSchema = z.object({
  logs: z.record(DateString, z.array(CardioEntrySchema)).default({}),
  customTypes: z.array(z.string()).default([]),
  lastUpdated: z.string().optional()
});

// Recovery schemas
export const RecoveryStateSchema = z.object({
  logs: z.record(DateString, z.object({
    type: z.enum(['rest', 'active', 'massage', 'stretching', 'other']),
    duration: z.number().min(0).optional(),
    notes: z.string().optional(),
    rating: z.number().min(1).max(10).optional()
  })).default({}),
  lastUpdated: z.string().optional()
});

// Measurements schemas
export const MeasurementEntrySchema = z.object({
  weight: z.number().min(0).optional(),
  bodyFat: z.number().min(0).max(100).optional(),
  muscle: z.number().min(0).max(100).optional(),
  notes: z.string().optional()
});

export const MeasurementsStateSchema = z.object({
  logs: z.record(DateString, MeasurementEntrySchema).default({}),
  units: z.object({
    weight: z.enum(['lbs', 'kg']).default('lbs'),
    height: z.enum(['ft', 'cm']).default('ft')
  }),
  lastUpdated: z.string().optional()
});

// Meditation schemas
export const MeditationStateSchema = z.object({
  logs: z.record(DateString, z.object({
    duration: z.number().min(0),
    type: z.string().default('mindfulness'),
    notes: z.string().optional()
  })).default({}),
  customTypes: z.array(z.string()).default([]),
  lastUpdated: z.string().optional()
});

// Supplements schemas
export const SupplementSchema = z.object({
  id: z.string(),
  name: z.string(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  notes: z.string().optional(),
  enabled: z.boolean().default(true)
});

export const SupplementsStateSchema = z.object({
  supplements: z.array(SupplementSchema).default([]),
  logs: z.record(DateString, z.record(z.string(), z.boolean())).default({}),
  lastUpdated: z.string().optional()
});

// Energy Level schemas
export const EnergyLevelStateSchema = z.object({
  logs: z.record(DateString, z.number().min(1).max(10)).default({}),
  lastUpdated: z.string().optional()
});

// Export type inference
export type WorkoutsState = z.infer<typeof WorkoutsStateSchema>;
export type HydrationState = z.infer<typeof HydrationStateSchema>;
export type FastingState = z.infer<typeof FastingStateSchema>;
export type GoalsState = z.infer<typeof GoalStateSchema>;
export type RemindersState = z.infer<typeof RemindersStateSchema>;
export type CardioState = z.infer<typeof CardioStateSchema>;
export type RecoveryState = z.infer<typeof RecoveryStateSchema>;
export type MeasurementsState = z.infer<typeof MeasurementsStateSchema>;
export type MeditationState = z.infer<typeof MeditationStateSchema>;
export type SupplementsState = z.infer<typeof SupplementsStateSchema>;
export type EnergyLevelState = z.infer<typeof EnergyLevelStateSchema>;

export type Workout = z.infer<typeof WorkoutSchema>;
export type Reminder = z.infer<typeof ReminderSchema>;
export type CardioEntry = z.infer<typeof CardioEntrySchema>;
export type Supplement = z.infer<typeof SupplementSchema>;
export type MeasurementEntry = z.infer<typeof MeasurementEntrySchema>;