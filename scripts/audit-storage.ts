import fs from 'node:fs';
import { inventoryTable } from './lib/storage-inventory';
import { applicationProgram, discoverStorage, checkCoverage } from './lib/storage-audit';
import { storageBoundaries } from './lib/storage-boundaries';
const context = applicationProgram();
const result = discoverStorage(context.program, context.files, context.root);
const errors = [...result.errors, ...checkCoverage(result.accesses, undefined, storageBoundaries)];
if (process.argv.includes('--json')) process.stdout.write(JSON.stringify({ ...result, errors }, null, 2));
else { for (const error of errors) console.error(error); console.log(`${result.accesses.length} storage call sites; ${errors.length} audit errors`); }
if (errors.length) process.exitCode = 1;

if (process.argv.includes('--write-inventory') && !errors.length) {
  const file = 'docs/audits/persistent-storage-inventory.md';
  const preface = fs.readFileSync(file, 'utf8').split('<!-- GENERATED TABLE -->')[0];
  fs.writeFileSync(file, preface + '<!-- GENERATED TABLE -->\n\n' + inventoryTable(result.accesses));
}
