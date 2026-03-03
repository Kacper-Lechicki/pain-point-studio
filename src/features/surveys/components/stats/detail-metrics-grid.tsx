import { Eye, Percent, Timer, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { BENTO_CARD_CLASS } from '@/features/dashboard/components/bento/bento-styles';
import { formatCompletionTime } from '@/features/surveys/lib/calculations';
import { cn } from '@/lib/common/utils';

function getCompletionColor(pct: number) {
  if (pct >= 70) {
    return {
      bar: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-l-emerald-500',
    };
  }

  if (pct >= 40) {
    return {
      bar: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-l-amber-500',
    };
  }

  return {
    bar: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-l-rose-500',
  };
}

interface DetailMetricsGridProps {
  viewCount: number;
  completedCount: number;
  maxRespondents: number | null;
  submissionRate: number | null;
  avgCompletionSeconds: number | null;
  respondentProgress: number | null;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accentBorder,
  valueClassName,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  accentBorder: string;
  valueClassName?: string | undefined;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn(BENTO_CARD_CLASS, 'border-l-2 p-4', accentBorder)}>
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {label}
        </p>
        <Icon className="text-muted-foreground/50 size-4 shrink-0" aria-hidden />
      </div>

      <div
        className={cn(
          'text-foreground mt-2 text-2xl leading-none font-bold tracking-tight tabular-nums',
          valueClassName
        )}
      >
        {value}
      </div>

      {children}
    </div>
  );
}

export function DetailMetricsGrid({
  viewCount,
  completedCount,
  maxRespondents,
  submissionRate,
  avgCompletionSeconds,
  respondentProgress,
}: DetailMetricsGridProps) {
  const completionTimeLabel = formatCompletionTime(avgCompletionSeconds);
  const t = useTranslations();

  const rateColors = submissionRate != null ? getCompletionColor(submissionRate) : null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        icon={Eye}
        label={t('surveys.dashboard.detailPanel.views')}
        value={viewCount}
        accentBorder="border-l-[var(--chart-violet)]"
      />

      <KpiCard
        icon={Users}
        label={t('surveys.dashboard.detailPanel.responses')}
        value={
          <>
            {completedCount}
            {maxRespondents != null && (
              <span className="text-muted-foreground text-sm font-normal"> / {maxRespondents}</span>
            )}
          </>
        }
        accentBorder="border-l-[var(--chart-cyan)]"
      >
        {respondentProgress != null && (
          <div className="bg-muted mt-2.5 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${respondentProgress}%` }}
            />
          </div>
        )}
      </KpiCard>

      <KpiCard
        icon={Percent}
        label={t('surveys.dashboard.detailPanel.submissionRate')}
        value={submissionRate != null ? `${submissionRate}%` : '—'}
        accentBorder={rateColors?.border ?? 'border-l-border'}
        valueClassName={rateColors?.text}
      />

      <KpiCard
        icon={Timer}
        label={t('surveys.dashboard.detailPanel.avgCompletionTime')}
        value={completionTimeLabel ?? '—'}
        accentBorder="border-l-emerald-500"
      />
    </div>
  );
}
