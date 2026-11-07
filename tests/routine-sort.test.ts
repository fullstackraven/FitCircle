import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Routine } from '../client/src/hooks/use-workouts';
import { sortRoutines, readRoutineSort, routineSortOptions, ROUTINE_SORT_KEY } from '../client/src/lib/routine-sort';
import { createBackup, prepareRestore } from '../client/src/lib/backup';
import { IDBFactory } from 'fake-indexeddb';
const r = (id:string,name:string,createdAt:string,selectedDays?:number[]):Routine => ({id,name,createdAt,selectedDays:selectedDays!});
const routines = [r('b','Beta','2026-01-01',[1,6]),r('a','Alpha','2026-02-01',[0,4]),r('c','Gamma','2026-01-15',[2,5]),r('d','Legacy','invalid')];
const expected = {
 'name-asc':['a','b','c','d'], 'name-desc':['d','c','b','a'],
 'created-asc':['b','c','a','d'], 'created-desc':['a','c','b','d'],
 'days-asc':['a','b','c','d'], 'days-desc':['b','c','a','d'],
};
for (const {value} of routineSortOptions) test(`${value}: sorts a copy; missing legacy values stay last`,()=>{
 const before=structuredClone(routines);Object.freeze(routines);
 assert.deepEqual(sortRoutines(routines,value).map(r=>r.id),expected[value]);assert.deepEqual(routines,before);
});
test('matching dates/days use name then stable ID; matching names use stable ID',()=>{
 const rows=[r('z','Same','2026-01-01',[3]),r('b','Same','2026-01-01',[3]),r('a','Alpha','2026-01-01',[3])];
 for(const sort of ['created-asc','created-desc','days-asc','days-desc','name-asc'] as const)assert.deepEqual(sortRoutines(rows,sort).map(r=>r.id),['a','b','z']);
 assert.deepEqual(sortRoutines(rows,'name-desc').map(r=>r.id),['b','z','a']);
 assert.deepEqual(sortRoutines([r('z','Missing','2020',[]),r('a','Valid','2021',[2])],'days-desc').map(r=>r.id),['a','z']);
});
test('preference safely defaults to oldest first without writing, and reads every valid option',()=>{
 for(const raw of [null,'invalid','{"sort":"name-asc"}'])assert.equal(readRoutineSort({getItem:()=>raw}),'created-asc');
 assert.equal(readRoutineSort({getItem:()=>{throw Error('denied');}}),'created-asc');
 for(const {value} of routineSortOptions)assert.equal(readRoutineSort({getItem:()=>value}),value);
});
test('separate optional preference round-trips through backups and old backups remain supported',async()=>{
 const entries=new Map([[ROUTINE_SORT_KEY,'days-desc'],['fitcircle_username','Tester']]);
 const storage={length:entries.size,key:(i:number)=>[...entries.keys()][i]??null,getItem:(k:string)=>entries.get(k)??null} as Storage;
 const backup=await createBackup(storage,new IDBFactory());assert.equal(prepareRestore(backup).entries[ROUTINE_SORT_KEY],'days-desc');
 assert.equal(prepareRestore({fitcircle_username:'Old backup'}).entries.fitcircle_username,'Old backup');
 assert.throws(()=>prepareRestore({[ROUTINE_SORT_KEY]:'bad'}),/routine sorting/);
});
