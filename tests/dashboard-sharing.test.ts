import { test } from 'node:test';
import assert from 'node:assert/strict';
import Decoder from '@zxing/library/esm/core/qrcode/decoder/Decoder';
import BitMatrix from '@zxing/library/esm/core/common/BitMatrix';
import { FITCIRCLE_URL, fitcircleQr } from '../client/src/lib/share-fitcircle';
import { licenseInventory, productionRoots } from '../scripts/third-party-licenses';

test('local QR encodes the canonical public URL with a four-module quiet zone', () => {
  const qr = fitcircleQr();
  const [left, top, width, height] = qr.getEnclosingRectangle();
  assert.equal(left, 4); assert.equal(top, 4);
  assert.equal(qr.getWidth() - left - width, 4);
  assert.equal(qr.getHeight() - top - height, 4);
  const content = new BitMatrix(width, height);
  for (let y=0;y<height;y++) for(let x=0;x<width;x++) if(qr.get(x+left,y+top)) content.set(x,y);
  assert.equal(new Decoder().decodeBitMatrix(content).getText(), FITCIRCLE_URL);
  assert.equal(FITCIRCLE_URL, 'https://fullstackraven.github.io/FitCircle/');
});

test('license notices are reproducible, complete for production dependencies, and exclude build/test tools', () => {
  const roots = productionRoots();
  const inventory = licenseInventory(roots);
  assert.deepEqual(inventory, licenseInventory(roots));
  for(const name of ['react','@zxing/library','@fontsource/jetbrains-mono','wouter']) assert.ok(inventory.some((item: {name:string})=>item.name===name));
  for(const name of ['@playwright/test','vite','typescript']) assert.equal(inventory.some((item: {name:string})=>item.name===name),false);
  for(const item of inventory) assert.ok(item.notices.length && item.notices.every((notice: {text:string})=>notice.text.trim().length>0),item.name);
  const font = inventory.find((item: {name:string})=>item.name==='@fontsource/jetbrains-mono');
  assert.ok(font);
  assert.match(font.notices.map((n: {text:string})=>n.text).join('\n'), /SIL OPEN FONT LICENSE/);
});
