export function WellnessHistory({
  stats,
  unit,
}: {
  stats: {
    average: number;
    loggedDayAverage: number;
    calendarDays: number;
    loggedDays: number;
  };
  unit: string;
}) {
  const value = (n: number) =>
    Number.isFinite(n)
      ? Math.abs(n) > Number.MAX_SAFE_INTEGER / 10
        ? n
        : Math.round(n * 10) / 10
      : 0;
  return (
    <details className="mt-4 text-sm text-muted-foreground">
      <summary className="cursor-pointer">Historical averages</summary>
      <p className="mt-2">
        All-time calendar-day average: {value(stats.average)} {unit} ·{" "}
        {stats.calendarDays} days
      </p>
      <p>
        All-time logged-day average: {value(stats.loggedDayAverage)} {unit} ·{" "}
        {stats.loggedDays} logged days
      </p>
    </details>
  );
}
