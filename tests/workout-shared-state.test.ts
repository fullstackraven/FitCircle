import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToString} from 'react-dom/server';
import {useWorkouts} from '../client/src/hooks/use-workouts';
import {stepWorkout} from '../client/src/lib/workout-progress';
import {workoutDataSchema} from '../client/src/lib/backup';
test('stale mounted consumers serialize edits, taps and journal commits without losing fields',()=>{
 const storageDescriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 const windowDescriptor=Object.getOwnPropertyDescriptor(globalThis,'window');
 let raw=JSON.stringify({workouts:{w:{id:'w',name:'Pushups',color:'green',count:0,dailyGoal:20,setsGoal:1}},dailyLogs:{},routines:{},journalEntries:{},lastDate:new Date().toLocaleDateString('en-CA')});let writes=0;let fail=false;
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>raw,setItem:(_k:string,v:string)=>{if(fail)throw Error('denied');raw=v;writes++;}}});
 Object.defineProperty(globalThis,'window',{configurable:true,value:{confirm:()=>true}});
 try {
 let first!:ReturnType<typeof useWorkouts>,second!:ReturnType<typeof useWorkouts>;
 function A(){first=useWorkouts();return null;}function B(){second=useWorkouts();return null;}
 renderToString(createElement(A));renderToString(createElement(B));assert.equal(writes,0);
 assert.equal(first.updateWorkout('w','Renamed',20,30,[1],'blue',2),true);
 second.incrementWorkout('w');assert.equal(first.addJournalEntry('2026-01-01','Keep journal'),true);
 const d=JSON.parse(raw);const day=Object.keys(d.dailyLogs)[0];assert.equal(d.workouts.w.name,'Renamed');assert.equal(d.workouts.w.setsGoal,2);assert.equal(d.dailyLogs[day].w.count,10);assert.equal(d.journalEntries['2026-01-01'].text,'Keep journal');
 assert.equal(first.updateWorkout('w','Renamed',20,30,[1],'blue',4),true);
 const changed=JSON.parse(raw);assert.equal(changed.dailyLogs[day].w.carriedReps,10);assert.equal(changed.dailyLogs[day].w.completedSets,0);assert.equal(changed.dailyLogs[day].w.setsGoalAtTime,4);
 second.incrementWorkout('w');const entry=JSON.parse(raw).dailyLogs[day].w;assert.equal(entry.count,15);assert.equal(stepWorkout(JSON.parse(raw).workouts.w,entry,-1).count,10);assert.equal(workoutDataSchema.safeParse(JSON.parse(raw)).success,true);
 const before=raw;fail=true;assert.equal(first.updateWorkout('w','Lost edit'),false);assert.equal(first.addJournalEntry('2026-01-02','Lost journal'),false);assert.equal(raw,before);
 } finally {if(storageDescriptor)Object.defineProperty(globalThis,'localStorage',storageDescriptor);else Reflect.deleteProperty(globalThis,'localStorage');if(windowDescriptor)Object.defineProperty(globalThis,'window',windowDescriptor);else Reflect.deleteProperty(globalThis,'window');}
});
