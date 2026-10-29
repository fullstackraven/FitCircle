import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createHash} from 'node:crypto';
import {auditPillControls} from '../scripts/lib/pill-controls-audit';

test('every reachable native action and shared-button usage is pill-based or explicitly classified',()=>{
 const result=auditPillControls();assert.deepEqual(result.errors,[]);assert.ok(result.controls.length>250);assert.equal(result.searches.length,3);
 assert.equal(result.controls.filter(c=>c.geometry==='protected food action').length,2);
 for(const file of ['button','select','collapsible'])assert.ok(fs.readFileSync(`client/src/components/ui/${file}.tsx`,'utf8').includes('fc-pill'));
});

test('Barcode and Custom Food JSX remain byte-identical to the approved pre-change implementation',()=>{
 const expected=JSON.parse(fs.readFileSync('tests/fixtures/protected-food-source.json','utf8')) as Record<string,string>;
 const file='client/src/pages/food-tracker.tsx',source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const found:Record<string,string>={};
 function walk(node:ts.Node){if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(source)==='button'){
  for(const label of Object.keys(expected))if(node.openingElement.getText(source).includes(`aria-label="${label}"`))found[label]=createHash('sha256').update(node.getText(source)).digest('hex');
 }ts.forEachChild(node,walk)}walk(source);assert.deepEqual(found,expected);
});
