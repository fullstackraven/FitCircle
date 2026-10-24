import { ChevronRight, FileText, Shield, Code2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { DashboardPage } from '@/components/DashboardPage';
import { dashboardContext, dashboardQuery } from '@/lib/dashboard-navigation';
import { versionLabel } from '@/lib/build-info';
export default function AboutPage() {
  const [, navigate] = useLocation(); const context = dashboardContext();
  return <DashboardPage title="About">
    <section className="fitcircle-card-lg divide-y divide-separator/60">
      {[{label:'Terms of Service', path:'terms', Icon:FileText}, {label:'Privacy Policy', path:'privacy', Icon:Shield}, {label:'Licenses', path:'licenses', Icon:Code2}].map(({label,path,Icon}) => <button key={path} onClick={()=>navigate(`/about/${path}`+(context.fromDashboard ? dashboardQuery(context.returnTo) : ''))} className="w-full min-h-14 flex items-center gap-3 py-4 text-left hover:text-accent-text"><Icon size={20} className="text-muted-foreground shrink-0" aria-hidden="true"/><span className="flex-1">{label}</span><ChevronRight size={18} className="text-muted-foreground" aria-hidden="true"/></button>)}
      <div className="py-4 flex flex-wrap justify-between gap-2"><span>Version</span><span className="text-sm text-muted-foreground tabular-nums break-all" data-testid="about-version">{versionLabel.replace('Version ', '')}</span></div>
    </section>
  </DashboardPage>;
}
