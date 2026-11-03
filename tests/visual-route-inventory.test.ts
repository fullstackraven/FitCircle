import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { visualRoutes } from './fixtures/visual-routes';

test('every routed screen is represented by the mobile/theme visual audit', () => {
  const source = readFileSync('client/src/App.tsx', 'utf8');
  const routes = [...source.matchAll(/<Route path="([^"]+)"/g)].map(match => match[1]);
  // Feature owners keep their existing base and editor routes mounted together.
  routes.push(...[...source.matchAll(/<FormOwner owner="([^"]+)"/g)].map(match => match[1] === 'home' ? '/' : match[1] === 'overview' ? '/dynamic-overview/:date' : `/${match[1]}`).filter(path=>path!=='/widgets'));
  // The separately tested routed-form matrix covers every editor in form-routes.ts.
  const baseRoutes=routes.filter(path=>path!=='/widgets/settings');
  const cases = visualRoutes.map(([path]) => path.replace('/dynamic-overview/2026-10-19', '/dynamic-overview/:date'));
  assert.equal(new Set(cases).size, cases.length, 'duplicate route audit case');
  assert.deepEqual(cases.filter(path => path !== '/not-a-fitcircle-route').sort(), baseRoutes.sort());
  assert.ok(cases.includes('/not-a-fitcircle-route'), 'fallback page is audited too');
});
