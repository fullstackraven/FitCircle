import {DashboardPage} from '@/components/DashboardPage';
import {useApplicationVersion} from '@/lib/build-info';
export default function ReleaseHistoryPage(){
 const build=useApplicationVersion();
 return <DashboardPage title="Release History" parent="/about">
  <p className="text-sm text-muted-foreground">FitCircle’s published updates, beginning with the 2.0.0 GitHub Pages migration. History is bundled for offline reading.</p>
  <ol className="space-y-3" aria-label="Published releases">
   {[...build.history].reverse().map(entry=><li key={entry.commit} className="fitcircle-card-lg space-y-2">
    <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-base font-semibold">FitCircle {entry.version}</h2><time className="text-xs text-muted-foreground" dateTime={entry.releasedAt}>{new Date(entry.releasedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'})}</time></div>
    <p className="text-sm text-supporting break-words">{entry.summary}</p>
    <details className="text-xs text-muted-foreground"><summary className="min-h-11 flex items-center cursor-pointer focus-visible:outline focus-visible:outline-ring">Release details</summary><p className="break-all py-2">Build {entry.commit.slice(0,8)}</p><div className="flex flex-wrap gap-3">{entry.prs.map(pr=><a key={pr} className="inline-flex items-center min-h-11 text-accent-text underline" href={`https://github.com/fullstackraven/FitCircle/pull/${pr}`} target="_blank" rel="noopener noreferrer">PR #{pr}</a>)}</div></details>
   </li>)}
  </ol>
 </DashboardPage>;
}
