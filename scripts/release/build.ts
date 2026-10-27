import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {stableVersion,validateCommit} from '../../client/src/lib/release-metadata';
import type {ApplicationBuild,HistoryEntry} from '../../client/src/lib/application-version';
export function generateBuildInfo(development=false):ApplicationBuild{
 const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();validateCommit(commit);
 const candidate=!development&&fs.existsSync('.release-candidate.json')?JSON.parse(fs.readFileSync('.release-candidate.json','utf8')):null;
 if(candidate&&(candidate.commit!==commit||!candidate.buildId))throw Error('Release candidate does not match checked-out build');
 if(candidate)stableVersion(candidate.version);
 const records=fs.existsSync('.release-history.json')?JSON.parse(fs.readFileSync('.release-history.json','utf8')):JSON.parse(fs.readFileSync('release/history.json','utf8')).releases;
 const history:HistoryEntry[]=records.map((r:any)=>({version:r.version,commit:r.commit,releasedAt:r.releasedAt,summary:r.summary??r.changes.map((c:any)=>c.summary).join('; '),prs:r.prs??r.changes.flatMap((c:any)=>c.pr?[c.pr]:[])}));
 return {version:candidate?.version??'0.0.0-dev',commit,buildId:candidate?.buildId??null,stage:candidate?'candidate':'development',releasedAt:null,history};
}
