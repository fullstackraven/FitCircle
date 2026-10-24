import { useEffect, useState } from 'react';
import { User, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { readTrainingOverview, readFitnessProfile } from '@/lib/fitness-profile';

/** One profile entry for every dock page; reads history without mounting a writer. */
export function SidebarProfileCard({ open, returnTo, onNavigate }: {
  open: boolean;
  returnTo: string;
  onNavigate: () => void;
}) {
  const [, navigate] = useLocation();
  const [training, setTraining] = useState<ReturnType<typeof readTrainingOverview>>(null);
  const [profile, setProfile] = useState<ReturnType<typeof readFitnessProfile> | null>(null);
  useEffect(() => {
    if (open) { setTraining(readTrainingOverview()); setProfile(readFitnessProfile()); }
  }, [open]);
  const openProfile = () => {
    onNavigate();
    navigate(`/profile?from=dashboard&returnTo=${encodeURIComponent(returnTo)}`);
  };
  return (
    <button className="w-full rounded-xl bg-surface/60 border border-separator/40 p-3 text-left hover:bg-surface transition-colors" onClick={openProfile}>
      <span className="flex items-center gap-3">
        <span className="w-11 h-11 shrink-0 rounded-full bg-accent-bright/10 flex items-center justify-center"><User size={24} className="text-accent-text" aria-hidden="true" /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-strong">My Fitness Profile</span><span className="block text-xs text-muted-foreground mt-1">Training overview &amp; goals</span></span>
        <ChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden="true" />
      </span>
      {profile?.name && <span className="block mt-3 text-sm text-strong break-words">{profile.name}</span>}
      {(profile?.objective || profile?.goal) && <span className="block mt-1 text-xs text-muted-foreground line-clamp-2 break-words">{profile.objective || profile.goal}</span>}
      <span className="flex flex-wrap justify-between gap-2 border-t border-separator/60 mt-3 pt-3 text-xs text-muted-foreground"><span>Your progress at a glance</span><span className="text-accent-text">{training && (training.totalReps > 0 || training.totalCompletedDays > 0) ? `${training.totalCompletedDays} active ${training.totalCompletedDays === 1 ? 'day' : 'days'}` : training ? 'No workouts recorded yet' : 'Training history unavailable'}</span></span>
    </button>
  );
}
