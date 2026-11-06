import { ChevronRight, Dumbbell, Pencil, Plus, Search, Wrench } from 'lucide-react';
import { FormContent, FormGroup } from '@/components/forms/form-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { exerciseCatalog, exerciseCategories, customCatalogItem, matchesCatalogExercise, type CatalogExercise, type EquipmentFilter } from '@/lib/exercise-catalog';
import type { Workout } from '@/hooks/use-workouts';

export function ExerciseCatalog({ open, onClose, exercises, search, category, equipment, onSearch, onCategory, onEquipment, onSelect, onCustom, onEdit }: {
  formId?: string; open:boolean; onClose:()=>void; exercises:Workout[]; search:string; category:string; equipment:EquipmentFilter;
  onSearch:(value:string)=>void; onCategory:(value:string)=>void; onEquipment:(value:EquipmentFilter)=>void;
  onSelect:(exercise:CatalogExercise, custom?:Workout)=>void; onCustom:()=>void; onEdit:(workout:Workout)=>void;
}) {
  const custom = exercises.filter(w => !w.catalogId && !w.catalogHidden && matchesCatalogExercise(customCatalogItem(w),search,category,equipment));
  const bundled = exerciseCatalog.filter(w => matchesCatalogExercise(w,search,category,equipment));
  const row = (item:CatalogExercise, definition?:Workout) => <div key={item.id} data-testid={`catalog-${item.id}`} className="flex min-w-0 items-center gap-1 border-b border-separator last:border-0">
    <button data-control-geometry="record" className="flex min-h-[72px] min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left" aria-label={`${definition ? 'Add' : 'Configure'} ${item.name}`} onClick={() => onSelect(item,definition)}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-muted-foreground">{definition ? <Wrench size={20}/> : <Dumbbell size={20}/>}</span>
      <span className="min-w-0 flex-1"><strong className="entity-name block font-semibold">{item.name}</strong><span className="block break-words text-sm text-muted-foreground">{item.equipment.join(' / ')}</span></span>
      <ChevronRight size={18} className="shrink-0 text-muted-foreground"/>
    </button>
    {definition && <Button size="icon" variant="ghost" className="mr-1 shrink-0 text-muted-foreground" aria-label={`Edit custom exercise ${item.name}`} onClick={() => onEdit(definition)}><Pencil size={17}/></Button>}
  </div>;
  return <FormGroup formId="exercise-catalog" open={open} onOpenChange={onClose}><FormContent headerActions={<Button aria-label="Custom Exercise" className="bg-accent-text text-[hsl(var(--on-selected-action))] hover:bg-action-hover hover:text-on-action" onClick={onCustom}><Plus size={18}/>Custom</Button>}>
    <div className="relative min-w-0"><Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"/><Input variant="search" className="w-full pl-11" type="search" aria-label="Search exercises" placeholder="Search exercises…" value={search} onChange={e => onSearch(e.target.value)}/></div>
    <div className="goal-editor-segments !grid-cols-3" role="group" aria-label="Equipment filter">{(['all','bodyweight','equipment'] as const).map(value => <Button key={value} className="px-2" variant="ghost" aria-pressed={equipment === value} onClick={() => onEquipment(value)}>{value === 'all' ? 'All' : value === 'bodyweight' ? 'Bodyweight' : 'Equipment'}</Button>)}</div>
    <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1" role="group" aria-label="Body-part filter">
      {[['all','All'],...exerciseCategories].map(([id,label]) => <Button key={id} aria-label={`Filter by ${label}`} variant="outline" className={`shrink-0 ${category === id ? 'bg-action-selected text-on-action' : ''}`} style={category === id ? {backgroundColor:'hsl(var(--accent-text))',color:'hsl(var(--on-selected-action))'} : undefined} aria-pressed={category === id} onClick={() => onCategory(id)}>{label}</Button>)}
    </div>
    <div aria-live="polite" className="sr-only">{custom.length + bundled.length} exercises found</div>
    {custom.length > 0 && <section className="space-y-3" aria-label="My Custom Exercises"><h2 className="text-xl font-bold">My Custom Exercises</h2><div className="overflow-hidden rounded-2xl border border-separator bg-surface">{custom.map(w => row(customCatalogItem(w),w))}</div></section>}
    {exerciseCategories.map(([id,label]) => {
      const entries=bundled.filter(w => w.category === id); return entries.length ? <section key={id} className="space-y-3" aria-label={label}><h2 className="text-xl font-bold">{label}</h2><div className="overflow-hidden rounded-2xl border border-separator bg-surface">{entries.map(w => row(w))}</div></section> : null;
    })}
    {!custom.length && !bundled.length && <p className="py-6 text-center text-sm text-muted-foreground">No exercises match your search.</p>}
  </FormContent></FormGroup>;
}
