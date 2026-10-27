import { ChevronRight, FileText, Shield, Code2, Info } from 'lucide-react';
import { useLocation } from 'wouter';
import { DashboardPage } from '@/components/DashboardPage';
import { dashboardContext, dashboardQuery } from '@/lib/dashboard-navigation';
import { useApplicationVersion } from '@/lib/build-info';
import { appVersionLabel } from '@/lib/application-version';
export default function AboutPage() {
  const build = useApplicationVersion();
  const [, navigate] = useLocation(); const context = dashboardContext();
  return <DashboardPage title="About">
    <section className="fitcircle-card-lg space-y-4" aria-label="About FitCircle">
      <div className="flex items-center gap-3"><Info className="text-muted-foreground" size={28} aria-hidden="true"/><div><h2 className="text-lg font-bold">About FitCircle</h2><p className="text-sm text-muted-foreground">Application information</p></div></div>
      <dl className="space-y-3 border-t border-separator pt-4 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">App Version</dt><dd className="text-right font-semibold break-words" data-testid="about-version">{appVersionLabel(build)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Build</dt><dd className="font-mono" data-testid="about-build">{build.commit.slice(0,8)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Released</dt><dd className="text-right" data-testid="about-released">{build.releasedAt ? new Date(build.releasedAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}) : build.stage==='development' ? 'Not published' : 'Verification pending'}</dd></div>
      </dl>
      <button onClick={()=>navigate('/about/releases'+(context.fromDashboard?dashboardQuery(context.returnTo):''))} className="w-full min-h-11 border-t border-separator pt-3 flex items-center justify-between text-accent-text text-sm font-medium focus-visible:outline focus-visible:outline-ring">View Release History<ChevronRight size={18} aria-hidden="true"/></button>
    </section>
    <section className="fitcircle-card-lg divide-y divide-separator/60">
      {[{label:'Terms of Service', path:'terms', Icon:FileText}, {label:'Privacy Policy', path:'privacy', Icon:Shield}, {label:'Licenses', path:'licenses', Icon:Code2}].map(({label,path,Icon}) => <button key={path} onClick={()=>navigate(`/about/${path}`+(context.fromDashboard ? dashboardQuery(context.returnTo) : ''))} className="w-full min-h-14 flex items-center gap-3 py-4 text-left hover:text-accent-text"><Icon size={20} className="text-muted-foreground shrink-0" aria-hidden="true"/><span className="flex-1">{label}</span><ChevronRight size={18} className="text-muted-foreground" aria-hidden="true"/></button>)}

    </section>
  </DashboardPage>;
}
