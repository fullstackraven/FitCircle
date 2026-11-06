import { ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function ExercisePicker({ onOpen, testId }: { onOpen:()=>void; testId?:string }) {
  return <Button variant="outline" className="w-full min-h-12 font-semibold text-accent-text" style={{backgroundColor:'hsl(var(--surface))'}} data-testid={testId} onClick={onOpen}>
    <Plus size={18}/><span className="flex-1">Add Exercise</span><ChevronRight size={18}/>
  </Button>;
}
