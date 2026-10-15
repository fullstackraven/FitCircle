import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base = '/FitCircle/';
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? files(`${dir}/${e.name}`) : `${dir}/${e.name}`))).flat();
}
const paths = (await files('dist')).filter(p => !p.endsWith('/sw.js')).sort();
const hash = createHash('sha256');
for (const p of paths) hash.update(p).update(await readFile(p));
const template = await readFile('scripts/sw-template.js', 'utf8');
hash.update(template);
await writeFile('dist/sw.js', template
  .replace('__CACHE_NAME__', `fitcircle-pages-${hash.digest('hex').slice(0, 16)}`)
  .replace('__PRECACHE__', JSON.stringify(paths.map(p => base + p.slice(5)))));
await writeFile('dist/.nojekyll', '');
