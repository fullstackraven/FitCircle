import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {recoveryHistory,recoveryFill,isRecoveryDate} from '../client/src/lib/recovery-history';
import {getDateString} from '../client/src/lib/date-utils';
import {useRecovery} from '../client/src/hooks/use-recovery';
const today=new Date(2026,9,28,12);
test('history is newest first, filters local calendar windows and does not mutate records',()=>{
 const dates=Object.freeze(['2025-12-12','2026-10-22','2026-10-28','2026-10-21','2026-09-29','2026-09-28','2026-10-29']);
 assert.deepEqual(recoveryHistory(dates,7,today),['2026-10-28','2026-10-22']);
 assert.deepEqual(recoveryHistory(dates,30,today),['2026-10-28','2026-10-22','2026-10-21','2026-09-29']);
 assert.equal(recoveryHistory(dates,'all',today).length,dates.length);assert.equal(dates[0],'2025-12-12');
});
test('history handles year, leap and daylight-saving calendar boundaries',()=>{
 assert.deepEqual(recoveryHistory(['2025-12-27','2025-12-28','2026-01-03'],7,new Date(2026,0,3)),['2026-01-03','2025-12-28']);
 assert.ok(isRecoveryDate('2024-02-29'));assert.ok(!isRecoveryDate('2026-02-29'));assert.ok(!isRecoveryDate('invalid'));
 assert.deepEqual(recoveryHistory(['2026-10-29','2026-11-01','2026-11-04'],7,new Date(2026,10,4)),['2026-11-04','2026-11-01','2026-10-29']);
 assert.deepEqual(recoveryHistory(['invalid'],'all',today),['invalid']);assert.deepEqual(recoveryHistory([],7,today),[]);
});
test('the existing recovery hook retains its numerator and denominator, including rates over 100%',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');let count=49;
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>JSON.stringify({recoveryDays:Array.from({length:count},(_,i)=>getDateString(new Date(2026,0,i+1)))}),setItem:()=>{throw Error('Read-only test');}}});
 try{
  let stats:ReturnType<ReturnType<typeof useRecovery>['getRecoveryStats']>|undefined;
  function Probe(){stats=useRecovery().getRecoveryStats(166);return null;}
  renderToString(React.createElement(Probe));assert.equal(stats?.totalRecoveryDays,49);assert.equal(stats?.totalWorkoutDays,166);assert.equal(stats?.recoveryPercentage,29.5);
  count=200;renderToString(React.createElement(Probe));assert.equal(stats?.recoveryPercentage,120.5);
 }finally{if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else Reflect.deleteProperty(globalThis,'localStorage');}
});
test('only visual progress is clamped, and invalid fills remain safe',()=>{
 for(const [rate,fill] of [[0,0],[29.5,29.5],[100,100],[120.5,100],[-2,0],[Infinity,0],[NaN,0]])assert.equal(recoveryFill(rate),fill);
});
