import { CheckCircle, Clock, Hash, Timer } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface StatsMetricsGridProps {
  totalResponses: number;
  completedResponses: number;
  inProgressResponses: number;
  maxRespondents: number | null;
  completionRate: number | null;
  respondentProgress: number | null;
  completionTimeLabel: string | null;
}

export function StatsMetricsGrid({
  totalResponses,
  completedResponses,
  inProgressResponses,
  maxRespondents,
  completionRate,
  respondentProgress,
  completionTimeLabel,
}: StatsMetricsGridProps) {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div className="border-border/50 rounded-md border px-3 py-2.5">
        <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
          {totalResponses}
        </div>
        <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-[11px]">
          <Hash className="size-3" aria-hidden />
          {t('surveys.stats.totalResponses')}
        </div>
      </div>
      <div className="border-border/50 rounded-md border px-3 py-2.5">
        <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
          {completedResponses}
          {maxRespondents != null && (
            <span className="text-muted-foreground text-xs font-normal"> / {maxRespondents}</span>
          )}
        </div>
        <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-[11px]">
          <CheckCircle className="size-3" aria-hidden />
          {t('surveys.stats.completedResponses')}
        </div>
        {respondentProgress != null && (
          <div className="bg-muted mt-2 h-1 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${respondentProgress}%` }}
            />
          </div>
        )}
      </div>
      <div className="border-border/50 rounded-md border px-3 py-2.5">
        <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
          {inProgressResponses}
        </div>
        <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-[11px]">
          <Clock className="size-3" aria-hidden />
          {t('surveys.stats.inProgress')}
        </div>
        {inProgressResponses > 0 && (
          <p className="text-muted-foreground mt-1 text-[10px]">
            {t('surveys.stats.inProgressHint')}
          </p>
        )}
      </div>
      {completionRate !== null && (
        <div className="border-border/50 rounded-md border px-3 py-2.5">
          <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
            {completionRate}%
          </div>
          <div className="text-muted-foreground mt-1.5 text-[11px]">
            {t('surveys.stats.completionRate')}
          </div>
        </div>
      )}
      {completionTimeLabel != null && (
        <div className="border-border/50 rounded-md border px-3 py-2.5">
          <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
            {completionTimeLabel}
          </div>
          <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-[11px]">
            <Timer className="size-3" aria-hidden />
            {t('surveys.stats.avgCompletionTime')}
          </div>
        </div>
      )}
    </div>
  );
}
