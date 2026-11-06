import { useId, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Pencil } from 'lucide-react';
import type { Workout } from '@/hooks/use-workouts';
import { Button } from '@/components/ui/button';

export function ExercisePicker({ exercises, assigned, onSelect, onCreate, onEdit, testId }: {
  exercises: Workout[]; assigned: string[]; onSelect: (exercise: Workout) => void; onCreate: () => void;
  onEdit?: (exercise: Workout) => void; testId?: string;
}) {
  const [open, setOpen] = useState(false); const id = useId();
  return <div className="space-y-2">
    <Button variant="outline" className="w-full min-h-12 font-semibold text-accent-text" style={{ backgroundColor: 'hsl(var(--surface))' }} aria-expanded={open} aria-controls={id} data-testid={testId} onClick={() => setOpen(!open)}>
      <Plus size={18}/><span className="flex-1">Add Exercise</span>{open ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
    </Button>
    {open && <div id={id} className="space-y-2">
      {exercises.map(w => <div key={w.id} className="flex min-w-0 gap-1">
        {!assigned.includes(w.id) && <Button variant="outline" className="h-auto min-h-11 min-w-0 flex-1 justify-start whitespace-normal" onClick={() => onSelect(w)}><span className="min-w-0 break-words text-left">Add {w.name}</span></Button>}
        {onEdit && <Button variant="ghost" className={assigned.includes(w.id) ? 'h-auto min-h-11 min-w-0 flex-1 justify-start whitespace-normal' : ''} aria-label={`Edit reusable exercise ${w.name}`} onClick={() => onEdit(w)}><Pencil size={16} className="shrink-0"/>{assigned.includes(w.id) ? <span className="min-w-0 break-words text-left">{w.name}</span> : null}</Button>}
      </div>)}
      <Button variant="outline" className="w-full" onClick={onCreate}><Plus size={18}/>Create New Exercise</Button>
    </div>}
  </div>;
}
