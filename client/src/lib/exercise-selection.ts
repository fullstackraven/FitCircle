import type { Workout } from '@/hooks/use-workouts';
import type { CatalogExercise, ExerciseCategory } from './exercise-catalog';
import { newPlanningId } from './routine-planning';
export type ExerciseMode = 'prebuilt' | 'reuse' | 'custom' | 'placement' | 'definition';
export function prebuiltExerciseSeed(template: CatalogExercise, existing?: Workout, pendingId?: string): Workout {
  return { id: existing?.id ?? pendingId ?? newPlanningId(), catalogId: template.id, name: template.name,
    category: template.category, color: existing?.color ?? 'green', equipment: template.equipment.join(' / '),
    notes: template.description ?? '', count:0, dailyGoal:0, setsGoal:0,
    prescription: { targetType:template.targetType,sets:0,perSet:0 } };
}
export function customExerciseSeed(category: ExerciseCategory = 'full-body-functional'): Workout {
  return { id:newPlanningId(),name:'',category,color:'green',equipment:'',notes:'',count:0,dailyGoal:0,setsGoal:0,
    prescription:{targetType:'repetitions',sets:0,perSet:0} };
}
