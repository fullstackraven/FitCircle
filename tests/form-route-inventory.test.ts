import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { formDefinitions } from '../client/src/lib/form-routes';

test('all remaining form workflows have unique registered routes and mobile test cases',()=>{
  assert.equal(formDefinitions.length,29);
  assert.equal(new Set(formDefinitions.map(([id])=>id)).size,29);
  assert.equal(new Set(formDefinitions.map(([, ,path])=>path)).size,29);
  const app=ts.createSourceFile('App.tsx',fs.readFileSync('client/src/App.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const patterns:RegExp[]=[], literal=new Set<string>();
  function visit(node:ts.Node){
    if(ts.isJsxAttribute(node)&&node.name.getText(app)==='path'&&node.initializer){
      if(ts.isStringLiteral(node.initializer))literal.add(node.initializer.text);
      else if(ts.isJsxExpression(node.initializer)&&node.initializer.expression?.kind===ts.SyntaxKind.RegularExpressionLiteral){
        const raw=node.initializer.expression.getText(app),end=raw.lastIndexOf('/');patterns.push(new RegExp(raw.slice(1,end),raw.slice(end+1)));
      }
    }ts.forEachChild(node,visit);
  }visit(app);
  const browser=fs.readFileSync('tests/fixtures/routed-form-cases.ts','utf8');
  for(const [id,,path]of formDefinitions){
    const actual=id==='duration'?'/dynamic-overview/2026-10-19/duration':path;
    assert.ok(literal.has(actual)||patterns.some(pattern=>pattern.test(actual)),`${id}: missing route registration`);
    assert.ok(browser.includes(actual),`${id}: missing focused route check`);
  }
  const source=fs.readFileSync('client/src/components/forms/form-page.tsx','utf8');
  assert.ok(!/createPortal|ViewportOverlay|DialogContent/.test(source),'forms must render as normal pages');
});
