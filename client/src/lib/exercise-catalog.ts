import data from '../data/exercise-catalog.json';
import type { Workout } from '@/hooks/use-workouts';
export const exerciseCategories = [
  ['chest','Chest'], ['back','Back'], ['shoulders','Shoulders'], ['biceps','Biceps'], ['triceps','Triceps'],
  ['forearms-grip','Forearms & Grip'], ['quadriceps','Quadriceps'], ['hamstrings-glutes','Hamstrings & Glutes'],
  ['calves-lower-legs','Calves & Lower Legs'], ['core-abdominals','Core & Abdominals'],
  ['full-body-functional','Full Body & Functional'], ['cardio-conditioning','Cardio & Conditioning'], ['mobility-recovery','Mobility & Recovery'],
] as const;
export type ExerciseCategory = typeof exerciseCategories[number][0];
export type EquipmentFilter = 'all' | 'bodyweight' | 'equipment';
export interface CatalogExercise {
  id: string; name: string; category: ExerciseCategory; secondaryCategories: ExerciseCategory[];
  equipment: string[]; targetType: 'repetitions' | 'duration'; aliases: string[]; description?: string;
}
export const exerciseCatalog = data as CatalogExercise[];
export const categoryName = (category: string) => exerciseCategories.find(([id]) => id === category)?.[1] ?? 'Full Body & Functional';
export const normalizeExerciseSearch = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
export function matchesCatalogExercise(item: CatalogExercise, search: string, category: string, equipment: EquipmentFilter) {
  if (category !== 'all' && item.category !== category && !item.secondaryCategories.includes(category as ExerciseCategory)) return false;
  const bodyweight = item.equipment.some(tool => tool.toLowerCase() === 'bodyweight');
  if (equipment === 'bodyweight' && !bodyweight || equipment === 'equipment' && bodyweight) return false;
  const haystack = normalizeExerciseSearch([item.name, ...item.aliases, categoryName(item.category), ...item.secondaryCategories.map(categoryName), ...item.equipment].join(' '));
  const query = normalizeExerciseSearch(search).replace(/\b(db|bb|kb|abs|quads|delts)\b/g, word => (({db:'dumbbell',bb:'barbell',kb:'kettlebell',abs:'abdominals',quads:'quadriceps',delts:'shoulders'} as Record<string,string>)[word]!));
  const compact = haystack.replace(/\s/g,'');
  return query.split(' ').filter(Boolean).every(token => haystack.includes(token) || compact.includes(token));
}
export function customCatalogItem(workout: Workout): CatalogExercise {
  return { id: workout.id, name: workout.name, category: workout.category ?? 'full-body-functional', secondaryCategories: [],
    equipment: [workout.equipment?.trim() || 'Bodyweight'], targetType: workout.prescription?.targetType ?? 'repetitions', aliases: [] };
}
