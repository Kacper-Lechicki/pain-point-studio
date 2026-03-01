'use client';

import { useMemo } from 'react';

import { ClipboardList, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getProjectDetailUrl } from '@/features/projects/lib/project-urls';
import type { UserSurvey } from '@/features/surveys/actions';
import { getSurveyStatsUrl } from '@/features/surveys/lib/survey-urls';
import Link from '@/i18n/link';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

// ── Status colors ───────────────────────────────────────────────────

const FALLBACK_COLOR = { bar: 'bg-muted-foreground/40', dot: 'bg-muted-foreground/40' } as const;

const STATUS_COLORS: Record<string, { bar: string; dot: string }> = {
  active: { bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  completed: { bar: 'bg-blue-500', dot: 'bg-blue-500' },
  draft: FALLBACK_COLOR,
};

function getStatusColor(status: string) {
  return STATUS_COLORS[status] ?? FALLBACK_COLOR;
}

// ── Component ───────────────────────────────────────────────────────

interface OverviewSurveyBreakdownProps {
  surveys: UserSurvey[];
  targetResponses: number;
  projectId: string;
  isArchived: boolean;
}

export function OverviewSurveyBreakdown({
  surveys,
  targetResponses,
  projectId,
  isArchived,
}: OverviewSurveyBreakdownProps) {
  const t = useTranslations();

  const sortedSurveys = useMemo(() => {
    const statusOrder: Record<string, number> = { active: 0, completed: 1, draft: 2 };

    return [...surveys]
      .filter((s) => s.status === 'active' || s.status === 'completed' || s.status === 'draft')
      .sort((a, b) => {
        const orderDiff = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);

        if (orderDiff !== 0) {
          return orderDiff;
        }

        return b.completedCount - a.completedCount;
      });
  }, [surveys]);

  const hasLegend =
    sortedSurveys.some((s) => s.status === 'active') ||
    sortedSurveys.some((s) => s.status === 'completed') ||
    sortedSurveys.some((s) => s.status === 'draft');

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="flex min-h-0 flex-col gap-3 p-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {t('projects.overview.surveyBreakdown' as MessageKey)}
        </p>

        {sortedSurveys.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <ClipboardList className="text-muted-foreground/50 size-8 shrink-0" aria-hidden />
            <p className="text-muted-foreground text-sm">
              {t('projects.overview.createFirstSurvey' as MessageKey)}
            </p>
            {!isArchived && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`${getProjectDetailUrl(projectId)}?tab=surveys`}>
                  <Plus className="size-3.5" aria-hidden />
                  {t('projects.detail.createSurvey' as MessageKey)}
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {sortedSurveys.map((survey) => {
                const target = Math.max(targetResponses, 1);
                const progress = Math.min(Math.round((survey.completedCount / target) * 100), 100);
                const colors = getStatusColor(survey.status);

                return (
                  <Link key={survey.id} href={getSurveyStatsUrl(survey.id)} className="group block">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-foreground min-w-0 flex-1 truncate text-sm group-hover:underline">
                        {survey.title}
                      </span>
                      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                        {survey.completedCount} / {targetResponses}
                      </span>
                    </div>
                    <div className="bg-foreground/5 mt-1.5 h-2 w-full overflow-hidden rounded-full">
                      <div
                        className={cn('h-full rounded-full transition-all', colors.bar)}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Legend */}
            {hasLegend && (
              <div className="text-muted-foreground flex flex-wrap gap-3 pt-1 text-xs">
                {sortedSurveys.some((s) => s.status === 'active') && (
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    {t('projects.overview.active' as MessageKey)}
                  </span>
                )}
                {sortedSurveys.some((s) => s.status === 'completed') && (
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-blue-500" />
                    {t('projects.overview.completed' as MessageKey)}
                  </span>
                )}
                {sortedSurveys.some((s) => s.status === 'draft') && (
                  <span className="flex items-center gap-1.5">
                    <span className="bg-muted-foreground/40 size-2 rounded-full" />
                    {t('projects.overview.draft' as MessageKey)}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
