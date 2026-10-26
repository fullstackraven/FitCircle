import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useWorkouts, type DailyLog } from '../client/src/hooks/use-workouts';

const cases: {name:string; now:string; month:[number,number]; logs:Record<string,DailyLog>; recovery?:string[]; days:number; reps:number; denominator:number}[] = [
  { name: 'October 26: one completed day', now: '2026-10-26', month: [2026,9], logs: {'2026-10-26': {w:10}}, days:1, reps:10, denominator:26 },
  { name: 'first day complete', now: '2026-10-01', month: [2026,9], logs: {'2026-10-01': {w:10}}, days:1, reps:10, denominator:1 },
  { name: 'one completed day on tenth', now: '2026-10-10', month: [2026,9], logs: {'2026-10-10': {w:10}}, days:1, reps:10, denominator:10 },
  { name: 'previous month uses full length', now: '2026-10-26', month: [2026,8], logs: {'2026-09-30': {w:10}}, days:1, reps:10, denominator:30 },
  { name: 'future records do not count', now: '2026-10-26', month: [2026,10], logs: {'2026-11-01': {w:10}}, recovery:['2026-11-02'], days:0, reps:0, denominator:1 },
  { name: 'zero completed days', now: '2026-10-26', month: [2026,9], logs: {'2026-10-25': {w:3}}, days:0, reps:3, denominator:26 },
  { name: 'leap February', now: '2024-03-01', month: [2024,1], logs: {'2024-02-29': {w:10}}, days:1, reps:10, denominator:29 },
  { name: 'non-leap February', now: '2025-03-01', month: [2025,1], logs: {'2025-02-28': {w:10}}, days:1, reps:10, denominator:28 },
  { name: 'December across year boundary', now: '2026-01-01', month: [2025,11], logs: {'2025-12-31': {w:10}}, days:1, reps:10, denominator:31 },
  { name: 'recovery, partial reps and historical goal preserved', now: '2026-10-26', month: [2026,9], logs: {'2026-10-24': {w:{count:5,goalAtTime:5}},'2026-10-25': {w:3}}, recovery:['2026-10-23','2026-10-24','2026-10-25'], days:2, reps:8, denominator:26 },
  { name: 'future days in current month excluded', now: '2026-10-26', month: [2026,9], logs: {'2026-10-26': {w:10},'2026-10-27': {w:10}}, days:1, reps:10, denominator:26 },
  { name: 'spring DST month', now: '2026-03-31', month: [2026,2], logs: {'2026-03-01': {w:10},'2026-03-31': {w:10}}, days:2, reps:20, denominator:31 },
  { name: 'fall DST month', now: '2026-11-30', month: [2026,10], logs: {'2026-11-01': {w:10},'2026-11-30': {w:10}}, days:2, reps:20, denominator:30 },
];
for (const fixture of cases) test(fixture.name, t => {
  const oldTZ = process.env.TZ;
  process.env.TZ = 'America/New_York';
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    // Local midnight, including year/month boundaries; isolate timezone for DST.
    t.mock.timers.enable({apis:['Date'],now:new Date(`${fixture.now}T00:00:00`).getTime()});
    const records: Record<string,string> = {
      'workout-tracker-data': JSON.stringify({workouts:{w:{id:'w',name:'Test',color:'green',count:0,dailyGoal:10,scheduledDays:[0,1,2,3,4,5,6]}},routines:{},journalEntries:{},lastDate:fixture.now,dailyLogs:fixture.logs}),
      'fitcircle_recovery_data':JSON.stringify({recoveryDays:fixture.recovery || []}),
    };
    const before = JSON.stringify(records);
    Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>records[key]??null,setItem:()=>assert.fail('statistics must not write')}});
    let result: ReturnType<ReturnType<typeof useWorkouts>['getMonthlyStats']> | undefined;
    function Probe(){ result=useWorkouts().getMonthlyStats(fixture.month[0],fixture.month[1]);return null; }
    renderToString(createElement(Probe));
    assert.ok(result);
    assert.equal(result.monthlyCompletedDays,fixture.days);
    assert.equal(result.monthlyReps,fixture.reps);
    assert.equal(result.monthlyConsistency,fixture.days/fixture.denominator*100);
    if(fixture.name.startsWith('October 26')) assert.equal(result.monthlyConsistency.toFixed(1),'3.8');
    assert.equal(JSON.stringify(records),before);
  } finally {
    t.mock.timers.reset();
    if(oldTZ === undefined) delete process.env.TZ; else process.env.TZ=oldTZ;
    if(descriptor) Object.defineProperty(globalThis,'localStorage',descriptor); else Reflect.deleteProperty(globalThis,'localStorage');
  }
});
