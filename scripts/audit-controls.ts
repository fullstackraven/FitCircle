import {auditPillControls} from './lib/pill-controls-audit';
const result=auditPillControls();
console.log(`${result.controls.length} reachable button/dropdown declarations; ${result.searches.length} search bars; ${result.errors.length} unexplained shape implementations`);
for(const error of result.errors)console.error(error);
if(result.errors.length)process.exitCode=1;
