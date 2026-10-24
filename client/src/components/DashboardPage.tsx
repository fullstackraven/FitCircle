import { AppHeader } from './AppHeader';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { dashboardContext, dashboardQuery, reopenDashboard } from '@/lib/dashboard-navigation';

export function DashboardPage({ title, parent, children }: { title: string; parent?: string; children: ReactNode }) {
  const [, navigate] = useLocation();
  const context = dashboardContext();
  const back = () => {
    if (parent) navigate(parent + (context.fromDashboard ? dashboardQuery(context.returnTo) : ''));
    else { if (context.fromDashboard) reopenDashboard(); navigate(context.fromDashboard ? context.returnTo : '/'); }
  };
  return <div className="w-full max-w-md mx-auto space-y-6 pt-4 text-strong">
    <AppHeader><div className="w-full max-w-md mx-auto px-4 min-h-14 flex items-center gap-2"><button aria-label="Back" onClick={back} className="min-h-11 min-w-11 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"><ArrowLeft size={20}/></button><h1 className="text-2xl font-bold tracking-tight break-words min-w-0">{title}</h1></div></AppHeader>
    {children}
  </div>;
}
