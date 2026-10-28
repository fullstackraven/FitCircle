import {test} from 'node:test';
import assert from 'node:assert/strict';
import {energyTrend} from '../client/src/lib/energy-trends';
const today=new Date(2026,9,28,12);
const history={'2026-09-01':10,'2026-10-10':2,'2026-10-22':4,'2026-10-25':8,'2026-10-28':6};
test('date ranges compute counts and averages from the same real records',()=>{
 const seven=energyTrend(history,7,today),thirty=energyTrend(history,30,today),all=energyTrend(history,'all',today);
 assert.equal(seven.average,'6.0');assert.equal(seven.daysLogged,3);assert.equal(seven.dates[0],'2026-10-22');assert.equal(seven.dates.at(-1),'2026-10-28');
 assert.equal(thirty.average,'5.0');assert.equal(thirty.daysLogged,4);assert.equal(all.average,'6.0');assert.equal(all.daysLogged,5);assert.equal(seven.todayEnergy,6);
});
test('no records and missing days never fabricate zero scores',()=>{
 assert.equal(energyTrend({},7,today).average,null);assert.equal(energyTrend({},7,today).todayEnergy,null);
 const single=energyTrend({'2026-10-25':8},7,today);assert.equal(single.daysLogged,1);assert.equal(single.average,'8.0');assert.equal(single.records.length,1);assert.equal(single.records[0].index,3);assert.equal(single.todayEnergy,null);
});
test('local calendar ranges cross month, year and leap-day boundaries',()=>{
 assert.deepEqual(energyTrend({},7,new Date(2026,0,3)).dates,['2025-12-28','2025-12-29','2025-12-30','2025-12-31','2026-01-01','2026-01-02','2026-01-03']);
 assert.ok(energyTrend({},7,new Date(2024,2,1)).dates.includes('2024-02-29'));assert.equal(energyTrend({},7,new Date(2026,10,4)).dates.length,7);
});
test('display filtering leaves invalid and legacy bytes untouched and keeps all-time records',()=>{
 const data={'invalid':3,'2026-02-30':4,'2026-10-28':6,'2026-10-25':0,'2026-11-01':8};const bytes=JSON.stringify(data);
 assert.equal(energyTrend(data,7,today).daysLogged,1);assert.equal(energyTrend(data,'all',today).daysLogged,2);assert.equal(JSON.stringify(data),bytes);assert.equal(energyTrend({'2026-10-28':6.5},7,today).average,'6.5');
});
