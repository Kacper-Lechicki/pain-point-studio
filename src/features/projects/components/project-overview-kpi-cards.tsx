'use client';

import { ClipboardList } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { BENTO_CARD_CLASS } from '@/config/layout';
import type { ProjectOverviewStats } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

function getCompletionColor(pct: number) {
  if (pct >= 70) {
    return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
  }

  if (pct >= 40) {
    return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
  }

  return { bar: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' };
}

interface ProjectOverviewKpiCardsProps {
  overviewStats: ProjectOverviewStats;
  targetResponses?: number | null | undefined;
}

export function ProjectOverviewKpiCards({
  overviewStats,
  targetResponses,
}: ProjectOverviewKpiCardsProps) {
  const t = useTranslations();

  const dist = overviewStats.surveyStatusDistribution;
  const surveyTotal = dist.active + dist.draft + dist.completed + dist.cancelled + dist.archived;

  const completion = overviewStats.avgCompletion;
  const colors = getCompletionColor(completion);
  const breakdown = overviewStats.completionBreakdown;
  const breakdownTotal = breakdown.completed + breakdown.inProgress + breakdown.abandoned;

  const avgTimeSeconds = overviewStats.avgTimeSeconds;
  let avgTimeDisplay: string;

  if (avgTimeSeconds != null && avgTimeSeconds > 0) {
    const minutes = Math.floor(avgTimeSeconds / 60);
    const secs = Math.round(avgTimeSeconds % 60);
    avgTimeDisplay = t('projects.overview.avgTimeValue' as MessageKey, {
      minutes,
      seconds: secs,
    });
  } else {
    avgTimeDisplay = t('projects.overview.avgTimeNone' as MessageKey);
  }

  return (
    <Card className={BENTO_CARD_CLASS}>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t('projects.overview.metrics' as MessageKey)}
          </span>
          <ClipboardList className="text-chart-emerald size-4 shrink-0" aria-hidden />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
              {t('projects.overview.surveys' as MessageKey)}
            </span>
            <span className="text-xl leading-none font-bold tabular-nums">
              {overviewStats.totalSurveys}
            </span>
            <div className="mt-1 h-5" />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
              {t('projects.overview.responses' as MessageKey)}
            </span>
            <span className="text-xl leading-none font-bold tabular-nums">
              {overviewStats.totalResponses}
              {targetResponses != null && targetResponses > 0 && (
                <span className="text-muted-foreground text-sm font-bold">/{targetResponses}</span>
              )}
            </span>
            <div className="mt-1 h-5" />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
              {t('projects.overview.avgTime' as MessageKey)}
            </span>
            <span className="text-xl leading-none font-bold tabular-nums">{avgTimeDisplay}</span>
            <div className="mt-1 h-5" />
          </div>
        </div>

        {surveyTotal > 0 && (
          <div className="border-border flex flex-col gap-2 border-t pt-3">
            <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
              {t('projects.overview.surveyBreakdown' as MessageKey)}
            </span>

            <div className="flex h-1.5 w-full overflow-hidden rounded-full">
              {dist.active > 0 && (
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(dist.active / surveyTotal) * 100}%` }}
                />
              )}
              {dist.draft > 0 && (
                <div
                  className="bg-muted-foreground/40 h-full transition-all duration-500"
                  style={{ width: `${(dist.draft / surveyTotal) * 100}%` }}
                />
              )}
              {dist.completed > 0 && (
                <div
                  className="h-full bg-violet-500 transition-all duration-500"
                  style={{ width: `${(dist.completed / surveyTotal) * 100}%` }}
                />
              )}
              {dist.cancelled > 0 && (
                <div
                  className="h-full bg-red-500 transition-all duration-500"
                  style={{ width: `${(dist.cancelled / surveyTotal) * 100}%` }}
                />
              )}
              {dist.archived > 0 && (
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${(dist.archived / surveyTotal) * 100}%` }}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
                <span className="tabular-nums">{dist.active}</span>{' '}
                {t('projects.overview.active' as MessageKey)}
              </span>
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <span className="bg-muted-foreground/40 size-2 shrink-0 rounded-full" />
                <span className="tabular-nums">{dist.draft}</span>{' '}
                {t('projects.overview.draft' as MessageKey)}
              </span>
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <span className="size-2 shrink-0 rounded-full bg-violet-500" />
                <span className="tabular-nums">{dist.completed}</span>{' '}
                {t('projects.overview.completed' as MessageKey)}
              </span>
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <span className="size-2 shrink-0 rounded-full bg-red-500" />
                <span className="tabular-nums">{dist.cancelled}</span>{' '}
                {t('projects.overview.cancelled' as MessageKey)}
              </span>
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <span className="size-2 shrink-0 rounded-full bg-amber-500" />
                <span className="tabular-nums">{dist.archived}</span>{' '}
                {t('projects.overview.archived' as MessageKey)}
              </span>
            </div>
          </div>
        )}

        <div className="border-border flex flex-col gap-2 border-t pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
              {t('projects.overview.completion' as MessageKey)}
            </span>
            <span className={cn('text-sm font-bold tabular-nums', colors.text)}>{completion}%</span>
          </div>

          <div className="bg-border h-1.5 w-full overflow-hidden rounded-full">
            <div
              className={cn('h-full rounded-full transition-all duration-500', colors.bar)}
              style={{ width: `${Math.min(completion, 100)}%` }}
            />
          </div>

          {breakdownTotal > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
                <span className="tabular-nums">{breakdown.completed}</span>{' '}
                {t('projects.overview.breakdownCompleted' as MessageKey)}
              </span>
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <span className="size-2 shrink-0 rounded-full bg-amber-500" />
                <span className="tabular-nums">{breakdown.inProgress}</span>{' '}
                {t('projects.overview.breakdownInProgress' as MessageKey)}
              </span>
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <span className="size-2 shrink-0 rounded-full bg-rose-500" />
                <span className="tabular-nums">{breakdown.abandoned}</span>{' '}
                {t('projects.overview.breakdownAbandoned' as MessageKey)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
