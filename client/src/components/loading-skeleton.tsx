import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-slate-700/50",
        className
      )}
    />
  );
}

export function CircleProgress({ size = "large" }: { size?: "small" | "medium" | "large" }) {
  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-20 h-20", 
    large: "w-24 h-24"
  };
  
  return (
    <div className={cn("rounded-full bg-slate-700/50 animate-pulse", sizeClasses[size])} />
  );
}

export function WorkoutCardSkeleton() {
  return (
    <div className="bg-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <div className="flex items-center justify-center py-4">
        <CircleProgress size="large" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-slate-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center space-y-2">
          <Skeleton className="h-6 w-12 mx-auto" />
          <Skeleton className="h-4 w-16 mx-auto" />
        </div>
        <div className="text-center space-y-2">
          <Skeleton className="h-6 w-12 mx-auto" />
          <Skeleton className="h-4 w-16 mx-auto" />
        </div>
        <div className="text-center space-y-2">
          <Skeleton className="h-6 w-12 mx-auto" />
          <Skeleton className="h-4 w-16 mx-auto" />
        </div>
      </div>
    </div>
  );
}

export function RecentActivitySkeleton() {
  return (
    <div className="bg-slate-800 rounded-xl p-6 space-y-4">
      <Skeleton className="h-6 w-40" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function QuoteSkeleton() {
  return (
    <div className="bg-slate-800 rounded-xl p-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

export function RoutineSkeleton() {
  return (
    <div className="bg-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <div className="space-y-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-2 bg-slate-700/30 rounded-lg">
            <CircleProgress size="small" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-6 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}