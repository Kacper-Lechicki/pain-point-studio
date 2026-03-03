'use client';

import { CheckCircle, ClipboardList, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { BENTO_CARD_CLASS } from '@/features/dashboard/components/bento/bento-styles';
import type { ProjectOverviewStats } from '@/features/projects/types';
import { SurveyStatusCountBadge } from '@/features/surveys/components/dashboard/survey-status-count-badge';
import type { SurveyStatus } from '@/features/surveys/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

// ── Helpers ─────────────────────────────────────────────────────────

function getCompletionColor(pct: number) {
  if (pct >= 70) {
    return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
  }

  if (pct >= 40) {
    return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
  }

  return { bar: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' };
}

// ── Component ───────────────────────────────────────────────────────

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
  const statusEntries: { status: SurveyStatus; count: number }[] = [
    { status: 'active', count: dist.active },
    { status: 'draft', count: dist.draft },
    { status: 'completed', count: dist.completed },
  ];

  const completion = overviewStats.avgCompletion;
  const colors = getCompletionColor(completion);

  return (
    <Card className={BENTO_CARD_CLASS}>
      <div className="flex flex-col gap-3 p-4">
        {/* Card header with icon */}
        <div className="flex shrink-0 items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t('projects.overview.metrics' as MessageKey)}
          </span>
          <ClipboardList className="text-chart-emerald size-4 shrink-0" aria-hidden />
        </div>

        {/* Surveys */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <ClipboardList className="text-muted-foreground/60 size-4 shrink-0" aria-hidden />
            <span className="text-sm">
              <span className="font-bold tabular-nums">{overviewStats.totalSurveys}</span>{' '}
              <span className="text-muted-foreground">
                {t('projects.overview.surveys' as MessageKey).toLowerCase()}
              </span>
            </span>
          </div>
          {statusEntries.some((e) => e.count > 0) && (
            <div className="ml-7 flex flex-wrap items-center gap-1">
              {statusEntries
                .filter((e) => e.count > 0)
                .map(({ status, count }) => (
                  <SurveyStatusCountBadge key={status} status={status} count={count} />
                ))}
            </div>
          )}
        </div>

        {/* Responses */}
        <div className="flex items-center gap-3">
          <MessageSquare className="text-muted-foreground/60 size-4 shrink-0" aria-hidden />
          <span className="text-sm">
            <span className="font-bold tabular-nums">{overviewStats.totalResponses}</span>
            {targetResponses != null && targetResponses > 0 && (
              <span className="text-muted-foreground font-bold tabular-nums">
                /{targetResponses}
              </span>
            )}{' '}
            <span className="text-muted-foreground">
              {t('projects.overview.responses' as MessageKey).toLowerCase()}
            </span>
          </span>
        </div>

        {/* Completion */}
        <div className="flex items-center gap-3">
          <CheckCircle className="text-muted-foreground/60 size-4 shrink-0" aria-hidden />
          <span className="text-sm">
            <span className={cn('font-bold tabular-nums', colors.text)}>{completion}%</span>{' '}
            <span className="text-muted-foreground">
              {t('projects.overview.completion' as MessageKey).toLowerCase()}
            </span>
          </span>
          <div className="bg-border h-1.5 min-w-12 flex-1 overflow-hidden rounded-full">
            <div
              className={cn('h-full rounded-full transition-all duration-500', colors.bar)}
              style={{ width: `${Math.min(completion, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
