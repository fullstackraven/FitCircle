import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applicationProgram, discoverStorage, checkCoverage } from '../scripts/lib/storage-audit';
import { storageBoundaries } from '../scripts/lib/storage-boundaries';
import { storageSources, findStorageSource } from '../client/src/lib/storage-registry';
import { completeStorage } from './fixtures/complete-storage';
import { inventoryTable } from '../scripts/lib/storage-inventory';

test('every shipped persistent source is registered, including dynamic keys and generic boundary counts', () => {
  const { program, files, root } = applicationProgram();
  const result = discoverStorage(program, files, root);
  assert.deepEqual([...result.errors, ...checkCoverage(result.accesses, storageSources, storageBoundaries)], []);
  assert.ok(result.accesses.length > 100);
  assert.ok(checkCoverage(result.accesses, storageSources, storageBoundaries.map((b, i) => i === 0 ? { ...b, count: b.count + 1 } : b)).some(e => e.includes('Review dynamic boundary')));
  assert.deepEqual(storageSources.filter(s => s.backup && s.mechanism !== 'localStorage').map(s => [s.mechanism, s.key]), [['IndexedDB', 'FitCircleCustomFoods/foods']], 'New non-localStorage sources require explicit exporter/restore support and round-trip tests');
  const inventory = fs.readFileSync('docs/audits/persistent-storage-inventory.md', 'utf8');
  for (const source of storageSources) assert.ok(inventory.includes('`' + source.key + '`'), `Missing inventory entry: ${source.key}`);
  for (const source of storageSources.filter(s => s.backup && s.mechanism === 'localStorage')) {
    for (const key of source.examples ?? [source.key]) assert.ok(key in completeStorage, `Missing feature fixture for ${key}`);
  }
});

test('AST regression: unknown aliases, dynamic keys and IndexedDB stores fail; registration passes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fitcircle-audit-'));
  try {
    const file = path.join(root, 'feature.ts');
    fs.writeFileSync(file, `
      const store = window.localStorage;
      store.setItem('fitcircle_new_feature', 'saved');
      const session = sessionStorage; session.setItem('new_session', 'saved');
      const date = String(Date.now()); localStorage.setItem('new_date_' + date, 'saved');
      const request = indexedDB.open('NewDatabase', 1);
      request.onsuccess = () => request.result.transaction('new-store', 'readwrite');
      const known = indexedDB.open('FitCircleCustomFoods', 1);
      known.onsuccess = () => known.result.createObjectStore('new-store');
      navigator.storage.getDirectory();
      const {setItem} = localStorage;
    `);
    const program = ts.createProgram([file], { target: ts.ScriptTarget.ES2022, strict: true });
    const result = discoverStorage(program, [file], root);
    const errors = checkCoverage(result.accesses);
    assert.ok(errors.some(e => e.includes('fitcircle_new_feature')));
    assert.ok(errors.some(e => e.includes('new_session')));
    assert.ok(errors.some(e => e.includes('new_date_*')));
    assert.ok(errors.some(e => e.includes('NewDatabase/new-store')));
    assert.ok(errors.some(e => e.includes('FitCircleCustomFoods/new-store')));
    assert.ok(result.errors.some(e => e.includes('filesystem')));
    assert.ok(result.errors.some(e => e.includes('Destructured')));
    const feature = result.accesses.filter(a => a.keys.includes('fitcircle_new_feature'));
    assert.deepEqual(checkCoverage(feature, [...storageSources, { key: 'fitcircle_new_feature', mechanism: 'localStorage', classification: 'user data', backup: true, kind: 'scalar', feature: 'New feature', reason: 'User-entered record must survive restore.' }]), []);
    assert.equal(findStorageSource('localStorage', 'insertAfterIndex')?.backup, false);
    assert.ok(checkCoverage(feature, [{ key: 'fitcircle_new_feature', mechanism: 'localStorage', classification: 'temporary', backup: false, reason: '', feature: 'Bad exclusion' }]).length);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('release receipt inventory remains metadata-only and does not claim the PWA cache writer',()=>{
  const source=findStorageSource('CacheStorage','fitcircle-release-receipts-v1');
  assert.equal(source?.classification,'metadata');assert.equal(source?.backup,false);
  assert.equal(findStorageSource('localStorage','fitcircle-release-receipts-v1'),undefined);
  const table=inventoryTable([
    {file:'client/src/lib/application-version.ts',line:19,owner:'receipt',mechanism:'CacheStorage',operation:'open',expression:'',keys:['fitcircle-release-receipts-v1']},
    {file:'scripts/sw-template.js',line:8,owner:'worker',mechanism:'CacheStorage',operation:'open',expression:'',keys:['__CACHE_NAME__']},
  ]);
  const row=table.split('\n').find(line=>line.startsWith('| `fitcircle-release-receipts-v1`'))!;
  assert.ok(row.includes('application-version.ts'));assert.ok(!row.includes('sw-template.js'));
  assert.ok(row.includes('| metadata | Excluded intentionally | Excluded intentionally |'));
  const pwa=table.split('\n').find(line=>line.startsWith('| `fitcircle-pages-*`'))!;
  assert.ok(pwa.includes('sw-template.js'));
});
