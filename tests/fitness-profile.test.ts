import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { ageFromDateOfBirth, readFitnessProfile, saveFitnessProfile, readMeasurementPreview, readTrainingOverview } from '../client/src/lib/fitness-profile';
import { createBackup, prepareRestore, applyRestore } from '../client/src/lib/backup';
class MemoryStorage implements Storage {
  values = new Map<string,string>(); failKey = '';
  get length() { return this.values.size; }
  key(i: number) { return [...this.values.keys()][i] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { if (key === this.failKey) { this.failKey=''; throw new Error('Synthetic quota'); } this.values.set(key,value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}
test('birthdays use local calendar dates before, on and after the day across timezones', () => {
  const previous=process.env.TZ;
  try { for (const zone of ['America/New_York','Pacific/Honolulu','Pacific/Auckland']) {
    process.env.TZ=zone;
    assert.equal(ageFromDateOfBirth('1990-10-18',new Date(2026,9,17,23,59)),35);
    assert.equal(ageFromDateOfBirth('1990-10-18',new Date(2026,9,18,0,0)),36);
    assert.equal(ageFromDateOfBirth('1990-10-18',new Date(2026,9,19)),36);
    assert.equal(ageFromDateOfBirth('2000-02-29',new Date(2025,1,28)),24);
    assert.equal(ageFromDateOfBirth('2000-02-29',new Date(2025,2,1)),25);
    for (const invalid of ['',null,'1990-02-30','2027-01-01','1990-13-01','18/10/1990']) assert.equal(ageFromDateOfBirth(invalid,new Date(2026,9,18)),null);
  }} finally { if(previous === undefined) delete process.env.TZ; else process.env.TZ=previous; }
});
test('read-only defaults never create records or infer a birth date', () => {
  const storage=new MemoryStorage();
  assert.equal(readFitnessProfile(storage).age,null);
  assert.equal(readTrainingOverview(storage)?.totalReps,0);
  assert.equal(readMeasurementPreview(storage),''); assert.equal(storage.length,0);
  storage.setItem('fitcircle_age','37');
  assert.equal(readFitnessProfile(storage).age,37); assert.equal(readFitnessProfile(storage).dateOfBirth,'');
  assert.equal(storage.length,1);
});
test('explicit DOB wins while legacy calculator/age metadata and unrelated records survive saves', () => {
  const storage=new MemoryStorage();
  const raw=JSON.stringify({age:42,gender:'female',height:68,unknown:{keep:true}});
  storage.setItem('fitcircle_profile',raw); storage.setItem('fitcircle_age','37'); storage.setItem('fitcircle_username','Legacy name'); storage.setItem('fitcircle_fitness_goal','Legacy free-form goal'); storage.setItem('unrelated','keep');
  assert.equal(readFitnessProfile(storage).age,42);
  saveFitnessProfile({name:'Updated name'},storage);
  assert.equal(storage.getItem('fitcircle_profile'),raw);
  saveFitnessProfile({dateOfBirth:'1990-10-18',objective:'Build strength'},storage,new Date(2026,9,17));
  assert.equal(readFitnessProfile(storage,new Date(2026,9,17)).age,35);
  assert.equal(readFitnessProfile(storage,new Date(2026,9,18)).age,36);
  assert.equal(storage.getItem('fitcircle_age'),'37'); assert.equal(storage.getItem('fitcircle_fitness_goal'),'Legacy free-form goal');
  const next=JSON.parse(storage.getItem('fitcircle_profile')!);
  assert.equal(next.age,42);assert.equal(next.gender,'female');assert.deepEqual(next.unknown,{keep:true}); assert.equal(storage.getItem('unrelated'),'keep');
});
test('malformed or unavailable profile data blocks edits without overwriting original bytes', () => {
  for (const raw of ['{','null','[]','42','"text"']) {
    const storage=new MemoryStorage();storage.setItem('fitcircle_profile',raw);storage.setItem('fitcircle_username','Keep name');
    assert.ok(readFitnessProfile(storage).error);
    assert.throws(()=>saveFitnessProfile({name:'Bad replacement'},storage));
    assert.equal(storage.getItem('fitcircle_profile'),raw);assert.equal(storage.getItem('fitcircle_username'),'Keep name');
  }
  const storage=new MemoryStorage();storage.getItem=()=>{throw new Error('Unavailable');};
  assert.ok(readFitnessProfile(storage).error);assert.throws(()=>saveFitnessProfile({name:'Replacement'},storage));assert.equal(storage.length,0);
});
test('invalid DOB and quota failures do not partially save a multi-field profile edit', () => {
  const storage=new MemoryStorage();storage.setItem('fitcircle_username','Original');storage.setItem('fitcircle_fitness_goal','Original goal');
  assert.throws(()=>saveFitnessProfile({name:'New',dateOfBirth:'2026-02-30'},storage));assert.equal(storage.getItem('fitcircle_username'),'Original');
  storage.failKey='fitcircle_fitness_goal';
  assert.throws(()=>saveFitnessProfile({name:'New',goal:'Changed'},storage));
  assert.equal(storage.getItem('fitcircle_username'),'Original');assert.equal(storage.getItem('fitcircle_fitness_goal'),'Original goal');
});
test('measurement preview reads the latest valid history without mounting a writer', () => {
  const storage=new MemoryStorage();const raw=JSON.stringify({weight:[{date:'2026-10-17',value:165},{date:'2026-10-01',value:170}],height:[{date:'2026-01-01',value:70}]});storage.setItem('fitcircle_measurements_history',raw);
  assert.equal(readMeasurementPreview(storage),'165 lb · 70 in');assert.equal(storage.getItem('fitcircle_measurements_history'),raw);
  storage.setItem('fitcircle_measurements_history','{');assert.equal(readMeasurementPreview(storage),'');assert.equal(storage.getItem('fitcircle_measurements_history'),'{');
});
test('new profile fields round-trip through existing v2 and legacy JSON backup formats', async () => {
  const storage=new MemoryStorage();saveFitnessProfile({dateOfBirth:'1990-10-18',objective:'Build muscle',name:'Synthetic',goal:'Free-form'},storage);
  storage.setItem('fitcircle_age','37');const backup=await createBackup(storage,new IDBFactory());const target=new MemoryStorage();applyRestore(prepareRestore(backup),target,target);
  assert.equal(target.getItem('fitcircle_profile'),storage.getItem('fitcircle_profile'));assert.equal(target.getItem('fitcircle_age'),'37');
  const legacy=new MemoryStorage();applyRestore(prepareRestore({fitcircle_profile:{age:42,gender:'female',dateOfBirth:'1990-10-18',primaryObjective:'Build muscle'},fitcircle_age:'37'}),legacy,legacy);
  assert.equal(readFitnessProfile(legacy,new Date(2026,9,17)).age,35);assert.equal(JSON.parse(legacy.getItem('fitcircle_profile')!).gender,'female');
});
