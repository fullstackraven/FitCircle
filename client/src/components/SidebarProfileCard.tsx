import { useEffect, useState } from 'react';
import { User, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { readTrainingOverview } from '@/lib/fitness-profile';

/** One profile entry for every dock page; reads history without mounting a writer. */
export function SidebarProfileCard({ open, returnTo, onNavigate }: {
  open: boolean;
  returnTo: string;
  onNavigate: () => void;
}) {
  const [, navigate] = useLocation();
  const [training, setTraining] = useState<ReturnType<typeof readTrainingOverview>>(null);
  useEffect(() => {
    if (open) setTraining(readTrainingOverview());
  }, [open]);
  const openProfile = () => {
    onNavigate();
    navigate(`/profile?from=dashboard&returnTo=${encodeURIComponent(returnTo)}`);
  };
  return (
    <button className="w-full rounded-xl bg-slate-800/60 border border-slate-700/40 p-3 text-left hover:bg-slate-800 transition-colors" onClick={openProfile}>
      <span className="flex items-center gap-3">
        <span className="w-11 h-11 shrink-0 rounded-full bg-green-400/10 flex items-center justify-center"><User size={24} className="text-green-400" aria-hidden="true" /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-white">My Fitness Profile</span><span className="block text-xs text-slate-400 mt-1">Training overview &amp; goals</span></span>
        <ChevronRight size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
      </span>
      <span className="flex flex-wrap justify-between gap-2 border-t border-slate-700/60 mt-3 pt-3 text-xs text-slate-400"><span>Your progress at a glance</span><span className="text-green-400">{training && (training.totalReps > 0 || training.totalCompletedDays > 0) ? `${training.totalCompletedDays} active ${training.totalCompletedDays === 1 ? 'day' : 'days'}` : training ? 'No workouts recorded yet' : 'Training history unavailable'}</span></span>
    </button>
  );
}
