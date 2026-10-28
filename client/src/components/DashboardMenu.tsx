import { Database, SlidersHorizontal, Share2, Info, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { SidebarProfileCard } from './SidebarProfileCard';
import { dashboardQuery } from '@/lib/dashboard-navigation';

export function DashboardMenu({ open, returnTo, onNavigate }: { open: boolean; returnTo: string; onNavigate: () => void }) {
  const [, navigate] = useLocation();
  return <nav aria-label="Dashboard" className="flex-1 min-w-0">
    <SidebarProfileCard open={open} returnTo={returnTo} onNavigate={onNavigate} />
    <div className="mt-5 divide-y divide-separator/60">
      {[
        { label: 'Account Data', path: '/account-data', Icon: Database },
        { label: 'Display', path: '/display', Icon: SlidersHorizontal },
        { label: 'Share', path: '/share', Icon: Share2 },
        { label: 'About', path: '/about', Icon: Info },
      ].map(({label, path, Icon}) => <button key={path} onClick={() => { onNavigate(); navigate(path + dashboardQuery(returnTo)); }} className="fc-pill w-full min-h-14 flex items-center gap-3 py-4 px-2 text-left hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
        <Icon size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="flex-1 text-strong font-medium">{label}</span>
        <ChevronRight size={18} className="text-muted-foreground" aria-hidden="true" />
      </button>)}
    </div>
  </nav>;
}
