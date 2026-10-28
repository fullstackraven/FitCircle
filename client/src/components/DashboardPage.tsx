import { PageHeader } from '@/components/ui/presentation';
import { AppHeader } from './AppHeader';
import type { ReactNode } from 'react';
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
    <AppHeader><PageHeader title={title} onBack={back} align="start" className="w-full max-w-md mx-auto px-4 min-h-14 mb-0" /></AppHeader>
    {children}
  </div>;
}
