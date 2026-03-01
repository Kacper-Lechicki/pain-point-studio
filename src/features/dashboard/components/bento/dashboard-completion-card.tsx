'use client';

import { LineChart } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CompletionBarChart } from '@/components/charts/completion-bar-chart';
import { Card, CardContent } from '@/components/ui/card';
import type { DashboardStats } from '@/features/dashboard/types/dashboard-stats';
import { cn } from '@/lib/common/utils';

import { BENTO_CARD_CLASS, BENTO_EMPTY_STATE_MIN_H } from './bento-styles';

interface DashboardCompletionCardProps {
  stats: DashboardStats | null;
  className?: string;
}

export function DashboardCompletionCard({ stats, className }: DashboardCompletionCardProps) {
  const t = useTranslations('dashboard.bento');

  const breakdown = !stats?.completionTimeline?.length
    ? { completed: 0, inProgress: 0, abandoned: 0 }
    : stats.completionTimeline.reduce(
        (acc, p) => ({
          completed: acc.completed + p.completed,
          inProgress: acc.inProgress + p.inProgress,
          abandoned: acc.abandoned + p.abandoned,
        }),
        { completed: 0, inProgress: 0, abandoned: 0 }
      );

  return (
    <Card className={cn(BENTO_CARD_CLASS, 'flex h-full min-w-0 flex-col', className)}>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 p-4">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t('charts.surveyCompletionRate')}
          </p>
          <LineChart className="text-chart-violet size-4 shrink-0" aria-hidden />
        </div>
        <div className={cn('flex min-h-0 flex-1 flex-col justify-start', BENTO_EMPTY_STATE_MIN_H)}>
          <CompletionBarChart
            data={breakdown}
            labels={{
              completed: t('charts.completion.completed'),
              inProgress: t('charts.completion.inProgress'),
              abandoned: t('charts.completion.abandoned'),
            }}
            noDataMessage={t('charts.noData')}
          />
        </div>
      </CardContent>
    </Card>
  );
}
