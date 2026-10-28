import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { visualRoutes } from './fixtures/visual-routes';

test('every routed screen is represented by the mobile/theme visual audit', () => {
  const source = readFileSync('client/src/App.tsx', 'utf8');
  const routes = [...source.matchAll(/<Route path="([^"]+)"/g)].map(match => match[1]);
  const cases = visualRoutes.map(([path]) => path.replace('/dynamic-overview/2026-10-19', '/dynamic-overview/:date'));
  assert.equal(new Set(cases).size, cases.length, 'duplicate route audit case');
  assert.deepEqual(cases.filter(path => path !== '/not-a-fitcircle-route').sort(), routes.sort());
  assert.ok(cases.includes('/not-a-fitcircle-route'), 'fallback page is audited too');
});
