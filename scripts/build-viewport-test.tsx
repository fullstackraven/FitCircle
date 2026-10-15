import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { DockNavigation } from '../client/src/components/DockNavigation';

// Render the exact presentation component without shipping React, routing or
// fitness modules to the test page. Run before generating the worker precache.
const markup = `<div class="test-dock">${renderToStaticMarkup(<DockNavigation location="/" />)}</div>`;
for (const variant of ['standard', 'control']) {
  const file = `dist/viewport-test/${variant}/index.html`;
  const html = await readFile(file, 'utf8');
  if (!html.includes('<!-- FITCIRCLE_DOCK -->')) throw new Error(`Missing dock insertion point in ${file}`);
  await writeFile(file, html.replace('<!-- FITCIRCLE_DOCK -->', markup));
}
await copyFile('client/src/styles/glass.css', 'dist/viewport-test/dock.css');
await copyFile('node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2', 'dist/viewport-test/dock-font.woff2');
