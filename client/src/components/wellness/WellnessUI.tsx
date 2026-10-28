import { PageHeader, PeriodSelector } from '@/components/ui/presentation';
import {
  forwardRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ChevronRight,
  Plus,
  Target,
  Pencil,
  Trash2,
} from "lucide-react";
import { useLocation } from "wouter";
import { ViewportOverlay } from "@/components/ui/viewport-overlay";
import { amount, percentage } from "@/lib/wellness-progress";
import {
  recentWellnessActivity,
  formatWellnessValue as fmt,
  type ActivityWindow,
} from "@/lib/wellness-activity";
import { useWellnessClock } from "@/hooks/use-preserved-wellness";

export function WellnessPageShell({
  title,
  accent,
  onGoal,
  children,
}: {
  title: string;
  accent: string;
  onGoal: () => void;
  children: ReactNode;
}) {
  const [, navigate] = useLocation();
  return (
    <div
      className="fitcircle-page wellness-page"
      style={{ "--wellness-accent": accent } as CSSProperties}
    >
      <div className="fitcircle-container wellness-stack">
        <PageHeader title={title} onBack={() => navigate('/wellness')} backLabel="Back to Wellness" sideWidth={70} className="mb-0" actions={<button className="fc-icon-action gap-1" onClick={onGoal}><Target size={18}/><span>Goal</span></button>} />
        {children}
      </div>
    </div>
  );
}
export function WellnessProgressHero({
  current,
  target,
  unit,
  period,
  title,
  inactive = false,
}: {
  current: number;
  target: number;
  unit: string;
  period: string;
  title: string;
  inactive?: boolean;
}) {
  const progress = inactive ? 0 : percentage(current, target);
  const value = inactive ? 0 : amount(current);
  const status = inactive
    ? "Not started"
    : !amount(target)
      ? "Set a goal"
      : progress >= 100
        ? "Goal achieved"
        : value
          ? "In progress"
          : "Not started";
  return (
    <section className="wellness-surface wellness-hero" aria-label={title}>
      <div className="min-w-0">
        <h2 className="wellness-eyebrow">Current progress</h2>
        <p className="wellness-value">
          <span>{fmt(value)}</span>
          <span className="wellness-target">
            {" "}
            / {fmt(amount(target))} {unit}
          </span>
        </p>
        <p className="text-sm text-muted-foreground mt-1">{period}</p>
        <p className="text-sm mt-3 wellness-accent">{status}</p>
        {!inactive && amount(target) > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {fmt(Math.max(0, target - value))} {unit} remaining
          </p>
        )}
      </div>
      <div
        className="wellness-ring"
        role="img"
        aria-label={`${Math.round(progress)}% of goal`}
      >
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="43" className="wellness-ring-track" />
          <circle
            cx="50"
            cy="50"
            r="43"
            className="wellness-ring-value"
            strokeDasharray={270.18}
            strokeDashoffset={270.18 * (1 - progress / 100)}
          />
        </svg>
        <span className="type-metric type-caption">
          {Math.round(progress)}%
        </span>
      </div>
    </section>
  );
}
export function WellnessRecentActivity({
  totals,
  unit,
  summary,
}: {
  totals: Record<string, number>;
  unit: string;
  summary?: (
    days: ActivityWindow,
    dates: string[],
    activeDays: number,
  ) => ReactNode;
}) {
  const [days, setDays] = useState<ActivityWindow>(7);
  const now = useWellnessClock();
  const activity = recentWellnessActivity(totals, days, now);
  const maximum = Math.max(1, ...activity.points.map((point) => point.value));
  return (
    <section className="wellness-surface" aria-label="Recent activity">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h2 className="wellness-eyebrow">Last {days} days</h2>
        <PeriodSelector<ActivityWindow> label="Activity window" className="fc-period-inline" value={days} onChange={setDays} options={[{value:7,label:'7D'},{value:30,label:'30D'},{value:90,label:'90D'}]} />
      </div>
      <div
        className="wellness-bars"
        style={{ gridTemplateColumns: `repeat(${days}, minmax(0, 1fr))` }}
        aria-hidden="true"
      >
        {activity.points.map((point) => (
          <div
            key={point.date}
            title={`${point.date}: ${fmt(point.value)} ${unit}`}
            className="wellness-bar-column"
          >
            <div
              className="wellness-bar"
              style={{
                height: `${point.value ? Math.max(4, (point.value / maximum) * 100) : 2}%`,
                opacity: point.value ? 1 : 0.25,
              }}
            />
          </div>
        ))}
      </div>
      <div
        className="flex justify-between text-xs text-muted-foreground mt-2"
        aria-hidden="true"
      >
        {days === 7 ? (
          activity.points.map((point) => (
            <span key={point.date}>
              {new Date(point.date + "T12:00:00").toLocaleDateString(
                undefined,
                { weekday: "narrow" },
              )}
            </span>
          ))
        ) : (
          <>
            <span>{activity.points[0].date}</span>
            <span>{activity.points[days - 1].date}</span>
          </>
        )}
      </div>
      <div className="flex flex-wrap justify-between gap-2 text-sm mt-3">
        <span className="type-metric wellness-accent">
          {fmt(activity.total)} {unit} total
        </span>
        <span className="text-muted-foreground">
          {fmt(activity.average)} {unit}/calendar day
        </span>
      </div>
      <p className="text-sm text-supporting mt-2">
        {summary
          ? summary(
              days,
              activity.points.map((point) => point.date),
              activity.activeDays,
            )
          : `${activity.activeDays} of ${days} days active`}
      </p>
      <table className="sr-only">
        <caption>Daily totals for the last {days} days</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>{unit}</th>
          </tr>
        </thead>
        <tbody>
          {activity.points.map((point) => (
            <tr key={point.date}>
              <td>{point.date}</td>
              <td>{fmt(point.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
export function WellnessTodaySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="wellness-surface wellness-today">
      <h2 className="text-base font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}
export const WellnessPrimaryAction = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(function WellnessPrimaryAction({ children, className = "", ...props }, ref) {
  return (
    <button ref={ref} {...props} className={`wellness-primary ${className}`}>
      <Plus size={18} />
      {children}
    </button>
  );
});
export const WellnessHistoryRow = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    month: string;
    count: number;
    unit: string;
  }
>(function WellnessHistoryRow({ month, count, unit, ...props }, ref) {
  return (
    <button {...props} ref={ref} className="wellness-history-row">
      <span>{month}</span>
      <span className="text-sm text-muted-foreground">
        {count} {count === 1 ? unit.replace(/s$/, "") : unit}
      </span>
      <ChevronRight className="wellness-history-chevron" size={18} />
    </button>
  );
});
export function WellnessGoalSheet({
  title,
  onDismiss,
  children,
}: {
  title: string;
  onDismiss: () => void;
  children: ReactNode;
}) {
  return (
    <ViewportOverlay title={title} onDismiss={onDismiss}>
      <div className="wellness-goal-sheet">{children}</div>
    </ViewportOverlay>
  );
}

export function WellnessEntryActions({
  label,
  onEdit,
  onDelete,
}: {
  label: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <span className="flex shrink-0">
      <button
        className="min-h-11 min-w-11 grid place-content-center text-muted-foreground"
        aria-label={`Edit ${label}`}
        onClick={onEdit}
      >
        <Pencil size={15} />
      </button>
      <button
        className="min-h-11 min-w-11 grid place-content-center text-muted-foreground"
        aria-label={`Delete ${label}`}
        onClick={onDelete}
      >
        <Trash2 size={15} />
      </button>
    </span>
  );
}
