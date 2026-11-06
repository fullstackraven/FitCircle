import test from 'node:test';
import assert from 'node:assert/strict';
import {migrateRoutinePlanning,plannedExercises,prescriptionFor,totalTarget,recordedReps,recordedSeconds,validPrescription,routineExercises,plannedWithActivity,placementLogId} from '../client/src/lib/routine-planning';
import {stepWorkout,workoutProgress} from '../client/src/lib/workout-progress';
import {parseStoredWorkouts} from '../client/src/lib/workout-initialization';
import {workoutDataSchema,createBackup,prepareRestore,applyRestore} from '../client/src/lib/backup';
import {getTotalWorkoutStats} from '../client/src/lib/workout-statistics';
import type {WorkoutData,Workout,Routine} from '../client/src/hooks/use-workouts';
import {IDBFactory} from 'fake-indexeddb';
const exercise:Workout={id:'w',name:'Row',color:'blue',dailyGoal:20,setsGoal:3,count:0,weightLbs:0,scheduledDays:[1,4]};
const routine:Routine={id:'r',name:'Upper',selectedDays:[1],createdAt:'2026-01-01'};
const legacy=():WorkoutData=>({workouts:{w:structuredClone(exercise),other:{...exercise,id:'other',scheduledDays:[6]}},routines:{r:structuredClone(routine)},dailyLogs:{'2026-01-01':{w:7},'2026-01-02':{w:{count:20,goalAtTime:20}}},journalEntries:{},lastDate:'2026-01-02'});
test('legacy overlap migration is deterministic, pure and idempotent without changing definitions or logs',()=>{
 const original=legacy(),raw=JSON.stringify(original),m=migrateRoutinePlanning(original);
 assert.equal(JSON.stringify(original),raw);assert.deepEqual(m.workouts,original.workouts);assert.deepEqual(m.dailyLogs,original.dailyLogs);
 assert.deepEqual(m.routines.r.placements?.map(p=>[p.id,p.exerciseId]),[['legacy:r:w','w']]);
 assert.equal(migrateRoutinePlanning(m),m);assert.deepEqual(parseStoredWorkouts(raw,'2026-01-02'),m);
 assert.deepEqual(plannedExercises(m,6).map(w=>w.id),['other']);
});
test('uneven legacy totals retain exact allocation, new reps and durations validate separately',()=>{
 const p=prescriptionFor(exercise);assert.equal(p.legacyTotal,20);assert.equal(totalTarget(p),20);
 let entry;const counts=[];for(let i=0;i<3;i++){entry=stepWorkout(exercise,entry,1);counts.push(entry.count);}assert.deepEqual(counts,[6,13,20]);
 assert.equal(validPrescription({targetType:'repetitions',sets:3,perSet:10}),true);
 assert.equal(validPrescription({targetType:'duration',sets:3,perSet:30}),true);
 for(const p of [{targetType:'repetitions',sets:0,perSet:10},{targetType:'duration',sets:3,perSet:-2},{targetType:'duration',sets:1.5,perSet:30},{targetType:'repetitions',sets:999,perSet:999}])assert.equal(validPrescription(p as any),false);
});
test('explicit assignments, ordering and multiple routines keep distinct placements, their order and independent Home targets',()=>{
 const m=migrateRoutinePlanning(legacy());m.routines.r.selectedDays=[3];m.routines.r.placements![0].prescription={targetType:'repetitions',sets:3,perSet:10};
 m.routines.second={...routine,id:'second',name:'Second',selectedDays:[3],createdAt:'2026-02-01',placements:[{id:'second-w',exerciseId:'w',prescription:{targetType:'repetitions',sets:2,perSet:20}}]};
 assert.equal(plannedExercises(m,1).some(w=>w.id==='w'),false);
 const planned=plannedExercises(m,3);assert.equal(planned.length,2);assert.deepEqual(planned.map(w=>w.dailyGoal),[30,40]);assert.deepEqual(planned.map(w=>w.routineNames),[['Upper'],['Second']]);assert.notEqual(planned[0].id,planned[1].id);
 m.routines.r.placements=[];assert.equal(routineExercises(m,m.routines.r).length,0);assert.equal(plannedExercises(m,3)[0].dailyGoal,40);assert.deepEqual(m.dailyLogs,legacy().dailyLogs);
});
test('legacy active variation targets and prescription edits never reinterpret an existing daily snapshot',()=>{
 const m=migrateRoutinePlanning(legacy()),r=m.routines.r,p=r.placements![0];
 const first=plannedExercises(m,1)[0],entry=stepWorkout(first,undefined,1);
 r.variations=[{id:'endurance',name:'Endurance',targets:{[p.id]:{targetType:'duration',sets:2,perSet:30,restSeconds:60}}}];r.activeVariationId='endurance';
 const timed=plannedExercises(m,1)[0];assert.equal(timed.dailyGoal,60);assert.equal(timed.restSeconds,60);
 assert.equal(workoutProgress(timed,entry).targetType,'repetitions');assert.equal(stepWorkout(timed,entry,1).count,13);
 const timedEntry=stepWorkout(timed,undefined,1);assert.equal(timedEntry.count,30);assert.equal(recordedReps(timedEntry),0);assert.equal(recordedSeconds(timedEntry),30);
 assert.deepEqual(m.dailyLogs,legacy().dailyLogs);
});
class MemoryStorage implements Storage {data=new Map<string,string>();get length(){return this.data.size;}key(i:number){return [...this.data.keys()][i]??null;}getItem(k:string){return this.data.get(k)??null;}setItem(k:string,v:string){this.data.set(k,v);}removeItem(k:string){this.data.delete(k);}clear(){this.data.clear();}}
for(const type of ['legacy','planned'])test(`${type} backup round trips without losing old records, placements, variations or archived definitions`,async()=>{
 const d=type==='legacy'?legacy():migrateRoutinePlanning(legacy());
 if(type==='planned'){d.archivedWorkouts={deleted:{...exercise,id:'deleted'}};d.routines.r.variations=[{id:'x',name:'Week B',targets:{'legacy:r:w':{targetType:'duration',sets:3,perSet:30}}}];d.routines.r.activeVariationId='x';d.dailyLogs['2026-01-03']={[placementLogId('r','timed')]:{exerciseIdAtTime:'w',routineIdAtTime:'r',placementIdAtTime:'timed',nameAtTime:'Row',colorAtTime:'blue',routineNamesAtTime:['Upper'],count:30,goalAtTime:90,targetTypeAtTime:'duration',completedSets:1,setsGoalAtTime:3}};}
 assert.equal(workoutDataSchema.safeParse(d).success,true);
 const raw=JSON.stringify(d),storage=new MemoryStorage(),target=new MemoryStorage();storage.setItem('workout-tracker-data',raw);
 const backup=await createBackup(storage,new IDBFactory());applyRestore(prepareRestore(JSON.parse(JSON.stringify(backup))),target,new MemoryStorage());assert.equal(target.getItem('workout-tracker-data'),raw);
 assert.deepEqual(parseStoredWorkouts(raw,'2026-01-02').dailyLogs,d.dailyLogs);
 const legacyTarget=new MemoryStorage();applyRestore(prepareRestore({'workout-tracker-data':d}),legacyTarget,new MemoryStorage());assert.deepEqual(JSON.parse(legacyTarget.getItem('workout-tracker-data')!),d);
});
test('duration activity never enters rep totals, including after archival',()=>{
 const d=migrateRoutinePlanning(legacy());d.archivedWorkouts={timed:{...exercise,id:'timed',prescription:{targetType:'duration',sets:1,perSet:30}}};d.dailyLogs['2026-01-02'].timed={count:30,goalAtTime:30,targetTypeAtTime:'duration',completedSets:1,setsGoalAtTime:1};
 const stats=getTotalWorkoutStats(d,()=>null);assert.equal(stats.totalReps,27);
});

test('archiving or rescheduling never hides already-recorded current-day activity from statistics',t=>{
 t.mock.timers.enable({apis:['Date'],now:new Date('2026-10-19T12:00:00').getTime()});
 try {
  const d:WorkoutData={workouts:{},archivedWorkouts:{w:exercise},routines:{},journalEntries:{},dailyLogs:{'2026-10-19':{w:{count:20,goalAtTime:20,completedSets:3,setsGoalAtTime:3,targetTypeAtTime:'repetitions'}}}};
  assert.equal(getTotalWorkoutStats(d,()=>null).totalReps,20);assert.equal(getTotalWorkoutStats(d,()=>null).totalCompletedDays,1);
  d.workouts.w=exercise;delete d.archivedWorkouts!.w;d.routines.r={...routine,selectedDays:[4],placements:[{id:'p',exerciseId:'w',prescription:prescriptionFor(exercise)}]};
  assert.equal(getTotalWorkoutStats(d,()=>null).totalReps,20);
 } finally {t.mock.timers.reset();}
});

test('legacy standalone schedules become ordinary routines once; later unassigned exercises never schedule themselves',()=>{
 const original=legacy(),raw=JSON.stringify(original),m=migrateRoutinePlanning(original);
 assert.equal(m.routineSchedulingVersion,1);assert.equal(JSON.stringify(original),raw);
 const imported=Object.values(m.routines).find(r=>r.name==='Imported workouts')!;
 assert.deepEqual(imported.selectedDays,[6]);assert.deepEqual(imported.placements?.map(p=>p.exerciseId),['other']);
 assert.equal(plannedExercises(m,6)[0].id,'other');
 const removed={...m,routines:{r:m.routines.r}};
 assert.equal(migrateRoutinePlanning(removed),removed);assert.deepEqual(plannedExercises(removed,6),[]);
 assert.deepEqual(removed.workouts,original.workouts);assert.deepEqual(removed.dailyLogs,original.dailyLogs);
});

test('routine weekdays alone schedule ordered placements, including repeated definitions and multiple routines',()=>{
 const m=migrateRoutinePlanning(legacy());m.routines.r.selectedDays=[3];
 const first=m.routines.r.placements![0];
 m.routines.r.placements!.push({...first,id:'another-placement',legacyLogId:undefined,prescription:{targetType:'duration',sets:2,perSet:30}});
 m.routines.second={...routine,id:'second',selectedDays:[3],placements:[{id:'third-placement',exerciseId:'w',prescription:{targetType:'repetitions',sets:3,perSet:10}}]};
 assert.equal(workoutDataSchema.safeParse(m).success,true);
 assert.deepEqual(plannedExercises(m,3).map(w=>[w.placementId,w.dailyGoal]),[[first.id,20],['another-placement',60],['third-placement',30]]);
 assert.equal(new Set(plannedExercises(m,3).map(w=>w.id)).size,3);
 assert.deepEqual(plannedExercises(m,1),[]);
 m.workouts.w.scheduledDays=[3];m.routines.r.selectedDays=[4];m.routines.second.selectedDays=[4];
 assert.deepEqual(plannedExercises(m,3),[]);assert.equal(plannedExercises(m,4).length,3);
 assert.deepEqual(m.dailyLogs,legacy().dailyLogs);
});

test('separate placement snapshots remain readable and counted after rescheduling and routine deletion',t=>{
 t.mock.timers.enable({apis:['Date'],now:new Date('2026-10-19T12:00:00').getTime()});
 try{
  const m=migrateRoutinePlanning(legacy());m.dailyLogs={};m.routines.r.selectedDays=[1];
  m.routines.second={...routine,id:'second',name:'Timed',selectedDays:[1],placements:[{id:'hold',exerciseId:'w',prescription:{targetType:'duration',sets:2,perSet:30}}]};
  const [a,b]=plannedExercises(m,1);m.dailyLogs['2026-10-19']={[a.id]:stepWorkout(a,undefined,1),[b.id]:stepWorkout(b,undefined,1)};
  const before=JSON.stringify(m.dailyLogs);assert.equal(getTotalWorkoutStats(m,()=>null).totalReps,6);
  assert.equal(m.dailyLogs['2026-10-19'][b.id] && recordedSeconds(m.dailyLogs['2026-10-19'][b.id]),30);
  assert.equal(workoutDataSchema.safeParse(m).success,true);
  delete m.routines.second;m.routines.r.selectedDays=[4];
  assert.equal(getTotalWorkoutStats(m,()=>null).totalReps,6);assert.equal(JSON.stringify(m.dailyLogs),before);
  assert.equal(parseStoredWorkouts(JSON.stringify(m),'2026-10-19').dailyLogs['2026-10-19'][b.id] instanceof Object,true);
 }finally{t.mock.timers.reset();}
});


test('numeric legacy completion keeps its original definition goal when routine targets differ',()=>{
 const d=migrateRoutinePlanning(legacy());d.routines.r.selectedDays=[1];d.routines.r.placements![0].prescription={targetType:'repetitions',sets:3,perSet:10};
 d.dailyLogs['2026-10-19']={w:20};const before=JSON.stringify(d.dailyLogs);
 const current=plannedWithActivity(d,1,'2026-10-19')[0];
 assert.equal(workoutProgress(current,20).repGoal,20);assert.equal(workoutProgress(current,20).count,20);
 assert.equal(plannedExercises(d,1)[0].dailyGoal,30);assert.equal(JSON.stringify(d.dailyLogs),before);
});
