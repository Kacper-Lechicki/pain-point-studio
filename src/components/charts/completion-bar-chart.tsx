'use client';

import { cn } from '@/lib/common/utils';

interface CompletionBarChartData {
  completed: number;
  inProgress: number;
  abandoned: number;
}

const SEGMENTS = [
  { key: 'completed' as const, color: 'var(--chart-emerald)' },
  { key: 'inProgress' as const, color: 'var(--chart-cyan)' },
  { key: 'abandoned' as const, color: 'var(--chart-rose)' },
] as const;

const DEFAULT_LABELS = {
  completed: 'Completed',
  inProgress: 'In progress',
  abandoned: 'Abandoned',
};

interface CompletionBarChartProps {
  data: CompletionBarChartData;
  labels?: { completed: string; inProgress: string; abandoned: string };
  noDataMessage?: string;
  className?: string;
}

export function CompletionBarChart({
  data,
  labels: labelsProp,
  noDataMessage = 'No data',
  className,
}: CompletionBarChartProps) {
  const labels = labelsProp ?? DEFAULT_LABELS;

  const rows = SEGMENTS.map(({ key }) => ({
    key,
    label: labels[key],
    count: data[key],
    color: SEGMENTS.find((s) => s.key === key)!.color,
  }));
  const total = data.completed + data.inProgress + data.abandoned;
  const maxCount = Math.max(...rows.map((r) => r.count), 1);

  const hasData = total > 0;

  if (!hasData) {
    return (
      <div
        className={cn(
          'text-muted-foreground flex flex-col items-center justify-center py-6 text-sm',
          className
        )}
      >
        {noDataMessage}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="space-y-2">
        {rows.map(({ key, label, count, color }) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const isTop = count === Math.max(...rows.map((r) => r.count));

          return (
            <div key={key} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    'min-w-0 truncate text-xs',
                    isTop ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
                <span className="text-foreground shrink-0 text-xs font-medium tabular-nums">
                  {count} <span className="text-muted-foreground font-normal">({pct}%)</span>
                </span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
