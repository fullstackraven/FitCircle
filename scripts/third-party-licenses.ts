import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

export function packageRoot(file: string) {
  let dir = path.dirname(file.split('?')[0]);
  while (dir.includes('node_modules')) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      const meta = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
      if (meta.name && meta.version) return dir;
    }
    dir = path.dirname(dir);
  }
  return null;
}
export function licenseInventory(roots: Iterable<string>) {
  return [...new Set(roots)].map(root => {
    const meta = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const files: string[] = [];
    const scan = (dir: string, depth = 0) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && depth < 3) scan(full, depth + 1);
        else if (entry.isFile() && /^(licen[cs]e|copying|notice|copyright|ofl)(\.|$|-)/i.test(entry.name)) files.push(path.relative(root, full));
      }
    };
    scan(root);
    const notices = files.sort().map(name => ({ file: name, text: fs.readFileSync(path.join(root, name), 'utf8') }));
    const mapping = JSON.parse(fs.readFileSync(path.resolve('scripts/license-notices/mapping.json'), 'utf8'));
    const supplement = mapping[`${meta.name}@${meta.version}`];
    if (supplement) notices.push({ file: 'Upstream license notice', text: fs.readFileSync(path.resolve('scripts/license-notices', supplement), 'utf8') });
    if (!notices.length) throw new Error(`Missing license notice for ${meta.name}`);
    return { name: meta.name, version: meta.version, license: meta.license ?? 'See notices', notices };
  }).sort((a,b) => `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`));
}
// Development preview: production dependency closure only, never devDependencies.
export function productionRoots() {
  const roots = new Set<string>();
  const visit = (name: string, from: string) => {
    const resolver = createRequire(path.join(from, 'package.json'));
    let entry: string;
    try { entry = resolver.resolve(name); } catch { entry = resolver.resolve(name + '/package.json'); }
    const root = packageRoot(entry);
    if (!root || roots.has(root)) return;
    roots.add(root);
    const meta = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    for (const dep of Object.keys(meta.dependencies ?? {})) visit(dep, root);
  };
  const base = process.cwd();
  const meta = JSON.parse(fs.readFileSync(path.join(base, 'package.json'), 'utf8'));
  for (const name of Object.keys(meta.dependencies)) visit(name, base);
  return roots;
}
