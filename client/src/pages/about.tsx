import { ChevronRight, FileText, Shield, Code2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { DashboardPage } from '@/components/DashboardPage';
import { dashboardContext, dashboardQuery } from '@/lib/dashboard-navigation';
import { useApplicationVersion } from '@/lib/build-info';
import { appVersionLabel } from '@/lib/application-version';
export default function AboutPage() {
  const build = useApplicationVersion();
  const [, navigate] = useLocation(); const context = dashboardContext();
  return <DashboardPage title="About">
    <section className="fitcircle-card-lg divide-y divide-separator/60">
      {[{label:'Terms of Service', path:'terms', Icon:FileText}, {label:'Privacy Policy', path:'privacy', Icon:Shield}, {label:'Licenses', path:'licenses', Icon:Code2}].map(({label,path,Icon}) => <button key={path} onClick={()=>navigate(`/about/${path}`+(context.fromDashboard ? dashboardQuery(context.returnTo) : ''))} className="fc-pill w-full min-h-14 flex items-center gap-3 py-4 text-left hover:text-accent-text"><Icon size={20} className="text-muted-foreground shrink-0" aria-hidden="true"/><span className="flex-1">{label}</span><ChevronRight size={18} className="text-muted-foreground" aria-hidden="true"/></button>)}
      <div className="flex items-start justify-between gap-3 py-4">
        <span className="font-semibold">Version</span>
        <div className="min-w-0 text-right text-muted-foreground">
          <div className="text-sm break-words"><span data-testid="about-version">{appVersionLabel(build)}</span> (<span data-testid="about-build">{build.commit.slice(0,8)}</span>)</div>
          <p className="mt-1 text-xs italic" data-testid="about-released">{build.releasedAt ? new Date(build.releasedAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}) : build.stage==='development' ? 'Not published' : 'Verification pending'}</p>
        </div>
      </div>
    </section>
    <button onClick={()=>navigate('/about/releases'+(context.fromDashboard?dashboardQuery(context.returnTo):''))} className="fc-pill w-full min-h-11 flex items-center justify-between text-accent-text text-sm font-medium focus-visible:outline focus-visible:outline-ring">View Release History<ChevronRight size={18} aria-hidden="true"/></button>
  </DashboardPage>;
}
