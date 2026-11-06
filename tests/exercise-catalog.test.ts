import test from 'node:test';
import assert from 'node:assert/strict';
import { exerciseCatalog, exerciseCategories, matchesCatalogExercise, normalizeExerciseSearch, customCatalogItem } from '../client/src/lib/exercise-catalog';
import { prebuiltExerciseSeed } from '../client/src/lib/exercise-selection';
import { retireRoutineVariations, migrateRoutinePlanning, preservePlacementDetails, routineExercises } from '../client/src/lib/routine-planning';
import { workoutDataSchema, createBackup, prepareRestore, applyRestore } from '../client/src/lib/backup';
import type { Workout, WorkoutData, Routine } from '../client/src/hooks/use-workouts';
import { IDBFactory } from 'fake-indexeddb';

test('bundled catalog has 200–220 unique stable templates across every category and no mandatory prescriptions',()=>{
 assert.ok(exerciseCatalog.length>=200 && exerciseCatalog.length<=220);
 assert.equal(new Set(exerciseCatalog.map(w=>w.id)).size,exerciseCatalog.length);
 assert.equal(new Set(exerciseCatalog.map(w=>normalizeExerciseSearch(w.name))).size,exerciseCatalog.length);
 for(const [id]of exerciseCategories)assert.ok(exerciseCatalog.filter(w=>w.category===id).length>=10,id);
 const valid=new Set(exerciseCategories.map(([id])=>id));
 for(const item of exerciseCatalog){assert.ok(item.id.startsWith('catalog:'));assert.ok(valid.has(item.category));assert.ok(item.secondaryCategories.every(c=>valid.has(c)));assert.ok(item.equipment.length);assert.ok(['repetitions','duration'].includes(item.targetType));assert.ok(!('sets'in item));assert.ok(!('perSet'in item));assert.ok(!('scheduledDays'in item));}
 assert.equal(exerciseCatalog.find(w=>w.name==='Push-ups')!.id,'catalog:push-ups');
 assert.equal(exerciseCatalog.find(w=>w.name==='Romanian Deadlift')!.id,'catalog:romanian-deadlift');
});
test('search normalizes aliases, partial words, muscle categories and equipment; filters never duplicate entries',()=>{
 const find=(query:string,category='all',equipment:'all'|'bodyweight'|'equipment'='all')=>exerciseCatalog.filter(w=>matchesCatalogExercise(w,query,category,equipment));
 for(const [q,name]of [['RDL','Romanian Deadlift'],['db bench','Dumbbell Bench Press'],['lat PD','Lat Pulldown'],['skull cru','Lying Triceps Extension'],['press up','Push-ups'],['romani','Romanian Deadlift'],['db curl','Alternating Dumbbell Curl'],['kb swing','Kettlebell Swing'],['abs','Plank'],['abwheel','Ab Wheel Rollout'],['worlds greatest','World’s Greatest Stretch']])assert.ok(find(q).some(w=>w.name===name),q);
 assert.ok(find('cable').length>10);assert.ok(find('abdominals').some(w=>w.name==='Plank'));
 const body=find('','chest','bodyweight'),tools=find('','chest','equipment');assert.ok(body.some(w=>w.name==='Push-ups'));assert.ok(!tools.some(w=>w.name==='Push-ups'));assert.ok(tools.some(w=>w.name==='Dumbbell Bench Press'));
 assert.ok(find('','biceps').every(w=>w.category==='biceps'||w.secondaryCategories.includes('biceps')));
 assert.deepEqual(find('unknown 12345'),[]);
});
const definition:Workout={id:'custom',name:'My row',category:'back',color:'blue',equipment:'Custom cable',notes:'Original',dailyGoal:20,setsGoal:2,prescription:{targetType:'repetitions',sets:2,perSet:10},weightLbs:40,restSeconds:60,count:0};
const routine:Routine={id:'r',name:'Routine',selectedDays:[1],createdAt:'2026-01-01',placements:[{id:'p',exerciseId:'custom',prescription:{targetType:'repetitions',sets:2,perSet:10}}]};
test('template selection never mutates bundled entries or an existing reusable identity',()=>{
 const item=exerciseCatalog.find(w=>w.name==='Romanian Deadlift')!,before=JSON.stringify(item);
 const seed=prebuiltExerciseSeed(item,definition);assert.equal(seed.id,definition.id);assert.equal(seed.dailyGoal,0);assert.equal(seed.prescription?.sets,0);assert.equal(JSON.stringify(item),before);assert.equal(definition.name,'My row');
 assert.ok(matchesCatalogExercise(customCatalogItem(definition),'custom cable','back','equipment'));
});
test('retiring active variations preserves effective targets/rest, IDs and historical records idempotently',()=>{
 const original={...routine,activeVariationId:'v',variations:[{id:'v',name:'Old variation',targets:{p:{targetType:'duration' as const,sets:3,perSet:30,restSeconds:45}}}]};
 const raw=JSON.stringify(original),retired=retireRoutineVariations(original);assert.equal(JSON.stringify(original),raw);assert.equal(retired.activeVariationId,undefined);assert.equal(retired.placements![0].id,'p');assert.deepEqual(retired.placements![0].prescription,{targetType:'duration',sets:3,perSet:30});assert.equal(retired.placements![0].restSeconds,45);assert.equal(retireRoutineVariations(retired),retired);
 const data:WorkoutData={workouts:{custom:definition},routines:{r:original},routineSchedulingVersion:1,journalEntries:{},dailyLogs:{'2025-01-01':{custom:7}}};const migrated=migrateRoutinePlanning(data);assert.deepEqual(migrated.dailyLogs,data.dailyLogs);assert.deepEqual(migrated.workouts,data.workouts);assert.equal(migrateRoutinePlanning(migrated),migrated);assert.equal(routineExercises(migrated,migrated.routines.r)[0].dailyGoal,90);
});
test('placement metadata and explicit no-weight/no-rest settings survive custom template changes and removal',()=>{
 const p=preservePlacementDetails(routine.placements![0],definition);
 const edited={...definition,name:'Edited template',equipment:'Other equipment',color:'red',notes:'Other',weightLbs:80,restSeconds:90,catalogHidden:true};
 const data:WorkoutData={workouts:{custom:edited},routines:{r:{...routine,placements:[p]}},dailyLogs:{},journalEntries:{},routineSchedulingVersion:1};
 const view=routineExercises(data,data.routines.r)[0];assert.equal(view.name,'My row');assert.equal(view.color,'blue');assert.equal(view.equipment,'Custom cable');assert.equal(view.weightLbs,40);assert.equal(view.restSeconds,60);
 data.routines.r.placements![0]={...p,weightLbs:null,restSeconds:null,notes:''};const cleared=routineExercises(data,data.routines.r)[0];assert.equal(cleared.weightLbs,undefined);assert.equal(cleared.restSeconds,undefined);assert.equal(cleared.notes,'');assert.equal(workoutDataSchema.safeParse(data).success,true);
});
class MemoryStorage implements Storage{data=new Map<string,string>();get length(){return this.data.size;}key(i:number){return [...this.data.keys()][i]??null;}getItem(k:string){return this.data.get(k)??null;}setItem(k:string,v:string){this.data.set(k,v);}removeItem(k:string){this.data.delete(k);}clear(){this.data.clear();}}
test('backup round trip preserves custom definitions, hidden templates, personalized placements and legacy variation metadata',async()=>{
 const data:WorkoutData={workouts:{custom:{...definition,catalogHidden:true}},routines:{r:{...routine,placements:[{...routine.placements![0],name:'Placement name',weightLbs:null,restSeconds:null,equipment:'Personal equipment'}],variations:[{id:'old',name:'Legacy only',targets:{}}]}},dailyLogs:{'2026-01-01':{custom:{count:20,goalAtTime:20,nameAtTime:'Recorded name',completedSets:2,setsGoalAtTime:2}}},journalEntries:{},routineSchedulingVersion:1};
 const source=new MemoryStorage(),target=new MemoryStorage(),raw=JSON.stringify(data);source.setItem('workout-tracker-data',raw);assert.equal(workoutDataSchema.safeParse(data).success,true);const backup=await createBackup(source,new IDBFactory());applyRestore(prepareRestore(JSON.parse(JSON.stringify(backup))),target,new MemoryStorage());assert.equal(target.getItem('workout-tracker-data'),raw);
});

test('template management retains legacy progress and atomic placement saves cannot overwrite existing user definitions',async()=>{
 const React=await import('react'),{renderToString}=await import('react-dom/server'),{useWorkouts}=await import('../client/src/hooks/use-workouts');
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 const storage=new MemoryStorage();storage.setItem('workout-tracker-data',JSON.stringify({workouts:{custom:definition},routines:{r:routine},routineSchedulingVersion:1,dailyLogs:{'2025-01-01':{custom:7}},journalEntries:{}}));
 try{
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:storage});
  let api!:ReturnType<typeof useWorkouts>;function Probe(){api=useWorkouts();return null;}renderToString(React.createElement(Probe));
  assert.equal(api.saveExerciseTemplate({...definition,name:'New default',dailyGoal:30,prescription:{targetType:'repetitions',sets:2,perSet:15}}),true);
  let saved=JSON.parse(storage.getItem('workout-tracker-data')!) as WorkoutData;
  assert.equal(routineExercises(saved,saved.routines.r)[0].name,'My row');assert.equal(routineExercises(saved,saved.routines.r)[0].dailyGoal,20);
  assert.deepEqual(saved.dailyLogs['2025-01-01'].custom,{count:7,goalAtTime:20,targetTypeAtTime:'repetitions',nameAtTime:'My row',colorAtTime:'blue',exerciseIdAtTime:'custom'});
  const before=storage.getItem('workout-tracker-data');
  assert.equal(api.saveRoutineExercise(saved.routines.r,{id:'other',exerciseId:'custom',prescription:{targetType:'repetitions',sets:1,perSet:10}},definition),false);assert.equal(storage.getItem('workout-tracker-data'),before);
  assert.equal(api.hideExerciseTemplate('custom'),true);saved=JSON.parse(storage.getItem('workout-tracker-data')!);assert.equal(saved.workouts.custom.catalogHidden,true);assert.equal(saved.routines.r.placements?.length,1);assert.equal((saved.dailyLogs['2025-01-01'].custom as any).count,7);
 }finally{if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else Reflect.deleteProperty(globalThis,'localStorage');}
});
