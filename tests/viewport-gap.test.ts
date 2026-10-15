import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeViewportGap } from '../client/public/layout-diagnostics.js';
function fixture(height = 812) {
  return { capturedAt: '2026-10-15T12:00:02Z', standalone: true, keyboard: false, editableFocused: false,
    innerHeight: height, clientHeight: height, devicePixelRatio: 3,
    visualViewport: { height, offsetTop: 0, scale: 1 }, viewportUnits: { dvh: { height } },
    screen: { width: 402, height: 874, orientation: 'portrait-primary', legacyAngle: 0 },
    elements: { '.app-shell': { rect: { bottom: height } }, '.app-content': { rect: { bottom: height } } } };
}
test('matching standalone DOM bounds plus a screen difference is conditional evidence only', () => {
  const metrics = fixture(), before = JSON.stringify(metrics);
  const result = analyzeViewportGap(metrics);
  assert.equal(result.classification, 'possible-system-controlled-region');
  assert.equal(result.screenMinusInner, 62);
  assert.equal(result.stableIdleComparison, false);
  assert.match(result.interpretation, /does not prove/);
  assert.equal(JSON.stringify(metrics), before);
});
test('screen differences in browser mode are not classified as system defects', () => {
  assert.equal(analyzeViewportGap({ ...fixture(), standalone: false }).classification, 'browser-mode-screen-difference-is-normal');
});
test('keyboard, zoom, editable focus and viewport panning suppress idle system inference', () => {
  for(const extra of [{keyboard:true},{editableFocused:true},{visualViewport:{height:812,offsetTop:20,scale:1}},{visualViewport:{height:812,offsetTop:0,scale:1.2}}]) {
    assert.equal(analyzeViewportGap({...fixture(),...extra}).classification,'keyboard-zoom-or-panning');
  }
});
test('an actual short scrollport is distinguished from a matching smaller web viewport', () => {
  const metrics = fixture();metrics.elements['.app-content'].rect.bottom=700;
  assert.equal(analyzeViewportGap(metrics).classification,'scrollport-ends-before-shell');
});
test('orientation normalizes screen CSS dimensions without applying device pixel ratio', () => {
  const metrics=fixture(340);metrics.screen.orientation='landscape-primary';metrics.screen.legacyAngle=90;
  assert.equal(analyzeViewportGap(metrics).normalizedScreenHeight,402);
  assert.equal(analyzeViewportGap(metrics).screenMinusInner,62);
  assert.equal(analyzeViewportGap({...metrics,devicePixelRatio:2}).screenMinusInner,62);
});
test('unknown orientation is reported rather than inferred from a keyboard-shrunken viewport', () => {
  const metrics=fixture();metrics.screen.orientation='';metrics.screen.legacyAngle=null as any;
  assert.equal(analyzeViewportGap(metrics).classification,'orientation-unconfirmed');
});
test('stable idle comparisons require separated matching samples in the same mode/orientation', () => {
  const metrics=fixture(), previous={...fixture(),capturedAt:'2026-10-15T12:00:00Z'};
  assert.equal(analyzeViewportGap(metrics,[previous]).stableIdleComparison,true);
  assert.equal(analyzeViewportGap(metrics,[{...previous,capturedAt:'2026-10-15T12:00:01.900Z'}]).stableIdleComparison,false);
  assert.equal(analyzeViewportGap(metrics,[{...previous,standalone:false}]).stableIdleComparison,false);
});
