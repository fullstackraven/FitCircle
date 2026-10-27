import { useRecovery } from '../client/src/hooks/use-recovery';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import React, { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { IDBFactory } from 'fake-indexeddb';
import { stepWorkout, workoutProgress, workoutLogComplete } from '../client/src/lib/workout-progress';
import { useWorkouts, type Workout, type WorkoutLogEntry } from '../client/src/hooks/use-workouts';
import { WorkoutWidget } from '../client/src/components/dashboard-widgets/WorkoutWidget';
import { parseStoredWorkouts } from '../client/src/lib/workout-initialization';
import { createBackup, prepareRestore, applyRestore, workoutDataSchema } from '../client/src/lib/backup';
const workout:Workout={id:'w',name:'Push-ups',color:'green',count:0,dailyGoal:20};
for(const [reps,sets,counts] of [[20,1,[20]],[20,2,[10,20]],[20,4,[5,10,15,20]],[100,4,[25,50,75,100]],[20,3,[6,13,20]]] as const) test(`${reps} reps / ${sets} sets allocate exactly and undo without drift`,()=>{
 const w={...workout,dailyGoal:reps,setsGoal:sets};let entry:WorkoutLogEntry|undefined;
 for(let i=0;i<sets;i++){entry=stepWorkout(w,entry,1);assert.equal(entry.count,counts[i]);assert.equal(entry.completedSets,i+1);assert.equal(workoutLogComplete(entry,reps),i===sets-1);}
 assert.deepEqual(stepWorkout(w,entry,1),entry);
 for(let i=sets-1;i>=0;i--){entry=stepWorkout(w,entry,-1);assert.equal(entry.count,i===0?0:counts[i-1]);assert.equal(entry.completedSets,i);}
 assert.deepEqual(stepWorkout(w,entry,-1),entry);
});
test('default one set and a partial legacy day keep separate meanings',()=>{
 assert.equal(stepWorkout(workout,undefined,1).count,20);
 let legacy=stepWorkout(workout,7,1);assert.equal(legacy.count,8);assert.equal(legacy.completedSets,undefined);
 while(legacy.count) legacy=stepWorkout(workout,legacy,-1);
 assert.equal(stepWorkout(workout,legacy,1).count,1); // Zero undo does not switch modes.
 assert.equal(workoutProgress(workout,7).mode,'reps');
});
test('set snapshots survive goal edits, including after undo to zero',()=>{
 const w={...workout,setsGoal:3};const first=stepWorkout(w,undefined,1);
 const changed={...w,dailyGoal:100,setsGoal:4};
 const second=stepWorkout(changed,first,1);assert.deepEqual([second.count,second.goalAtTime,second.setsGoalAtTime],[13,20,3]);
 const zero=stepWorkout(changed,first,-1);assert.deepEqual(stepWorkout(changed,zero,1),first);
 assert.equal(stepWorkout(changed,undefined,1).count,25); // next day has no entry
});
test('completion reads set metadata; legacy goals still use reps',()=>{
 assert.equal(workoutLogComplete({count:20,goalAtTime:20,completedSets:1,setsGoalAtTime:2},20),false);
 assert.equal(workoutLogComplete({count:20,goalAtTime:20},20),true);
 assert.equal(workoutLogComplete(19,20),false);
});
const mixed=()=>({workouts:{w:{...workout,setsGoal:3}},routines:{},journalEntries:{},lastDate:'2026-10-27',dailyLogs:{'2026-10-25':{w:20},'2026-10-26':{w:{count:20,goalAtTime:20}},'2026-10-27':{w:{count:6,goalAtTime:20,completedSets:1,setsGoalAtTime:3}}}});
test('initialization preserves mixed formats exactly; invalid set records are rejected',()=>{
 const data=mixed(),raw=JSON.stringify(data);assert.equal(JSON.stringify(parseStoredWorkouts(raw,'2026-10-27')),raw);
 for(const fields of [{completedSets:-1},{completedSets:4},{setsGoalAtTime:0},{setsGoalAtTime:21},{count:7},{completedSets:undefined},{completedSets:1.5}]){
 const bad=mixed();Object.assign(bad.dailyLogs['2026-10-27'].w,fields);assert.equal(workoutDataSchema.safeParse(bad).success,false);
 }
 assert.equal(workoutDataSchema.safeParse({...data,workouts:{w:{...workout,setsGoal:21}}}).success,false);
});
test('mixed logs retain rep totals, monthly denominator, and set progress in widgets',t=>{
 t.mock.timers.enable({apis:['Date'],now:new Date('2026-10-27T12:00:00').getTime()});
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 try {
 const raw=JSON.stringify(mixed());Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>key==='workout-tracker-data'?raw:null,setItem:()=>assert.fail('read must not write')}});
 function Probe(){const api=useWorkouts();const m=api.getMonthlyStats(2026,9),a=api.getTotalStats();assert.equal(m.monthlyReps,46);assert.equal(a.totalReps,46);assert.equal(m.monthlyCompletedDays,2);assert.equal(a.totalCompletedDays,2);assert.equal(m.monthlyConsistency,2/27*100);assert.equal(api.getRecentActivity().find(d=>d.dateString==='2026-10-27')?.totalReps,6);return null;}
 renderToString(createElement(Probe));
 const reactDescriptor=Object.getOwnPropertyDescriptor(globalThis,'React');
 Object.defineProperty(globalThis,'React',{configurable:true,value:React});
 let html:string;
 try { html=renderToString(createElement(WorkoutWidget,{widget:{id:'test',type:'workout',title:'Workouts',size:'small',enabled:true,position:0}})); } finally { if(reactDescriptor) Object.defineProperty(globalThis,'React',reactDescriptor);else Reflect.deleteProperty(globalThis,'React'); }
 assert.match(html,/33/);assert.doesNotMatch(html,/>30<!--/);
 } finally {if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else Reflect.deleteProperty(globalThis,'localStorage');t.mock.timers.reset();}
});
class MemoryStorage implements Storage {
 private data=new Map<string,string>();get length(){return this.data.size;}key(i:number){return [...this.data.keys()][i]??null;}getItem(k:string){return this.data.get(k)??null;}setItem(k:string,v:string){this.data.set(k,v);}removeItem(k:string){this.data.delete(k);}clear(){this.data.clear();}
}
test('full JSON backup/restore round-trips mixed legacy and set fields byte-for-byte',async()=>{
 const source=new MemoryStorage(),target=new MemoryStorage(),factory=new IDBFactory();
 const raw=JSON.stringify(mixed());source.setItem('workout-tracker-data',raw);
 const backup=await createBackup(source,factory);const plan=prepareRestore(JSON.parse(JSON.stringify(backup)));
 applyRestore(plan,target,new MemoryStorage());
 assert.equal(target.getItem('workout-tracker-data'),raw);assert.equal(source.getItem('workout-tracker-data'),raw);
});

test('recovery fallback recognizes completed set logs without altering legacy counting or records',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 const data=mixed();data.dailyLogs['2026-10-27'].w={count:20,goalAtTime:20,completedSets:3,setsGoalAtTime:3};
 const raw=JSON.stringify(data);
 try {
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>k==='workout-tracker-data'?raw:null,setItem:()=>assert.fail('read must not write')}});
 function Probe(){assert.equal(useRecovery().getRecoveryStats().totalWorkoutDays,2);return null;}
 renderToString(createElement(Probe));
 } finally {if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else Reflect.deleteProperty(globalThis,'localStorage');}
});
