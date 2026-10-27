import { storageSources } from '../../client/src/lib/storage-registry';
import type { Access } from './storage-audit';
export function inventoryTable(accesses: Access[]) {
  const header = '| Key / pattern | Mechanism | Feature | Read/write source files (operations) | Classification | Backup | Restore | Reason |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n';
  return header + storageSources.map(source => {
    const sites = accesses.filter(a => a.mechanism === source.mechanism && a.keys.some(key => key === source.key || key === source.dynamic || source.pattern?.test(key) || (a.mechanism === 'IndexedDB' && a.operation === 'open' && source.key.startsWith(key + '/')) || (a.mechanism === 'CacheStorage' && source.key === 'fitcircle-pages-*' && key === '__CACHE_NAME__')));
    const files = [...new Set(sites.map(a => `\`${a.file}\` (${a.operation})`))].join('<br>') || 'Compatibility-only declaration; `client/src/lib/backup.ts` enumerates and restores registered keys; no active direct feature access';
    return `| \`${source.key}\` | ${source.mechanism} | ${source.feature} | ${files} | ${source.classification} | ${source.backup ? 'Included' : 'Excluded intentionally'} | ${source.backup ? source.mechanism === 'IndexedDB' ? 'Merged into current food store' : 'Restorable' : 'Excluded intentionally'} | ${source.reason} |`;
  }).join('\n') + '\n';
}
