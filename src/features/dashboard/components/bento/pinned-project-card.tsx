'use client';

import { useTransition } from 'react';

import { Pin, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { OverviewProject } from '@/features/dashboard/actions/get-dashboard-overview';
import { setPinnedProject } from '@/features/dashboard/actions/set-pinned-project';
import {
  BENTO_CARD_CLASS,
  BENTO_ROW4_CARD_MIN_H,
} from '@/features/dashboard/components/bento/bento-styles';
import type { ProjectDetail, ProjectSurvey } from '@/features/projects/actions/get-project';
import { getSurveyStatsUrl } from '@/features/surveys/lib/survey-urls';
import Link from '@/i18n/link';
import { cn } from '@/lib/common/utils';

const SURVEY_STATUS_DOT: Record<string, string> = {
  active: 'bg-emerald-500',
  completed: 'bg-blue-500',
  draft: 'bg-muted-foreground/40',
  cancelled: 'bg-red-500',
  pending: 'bg-amber-500',
  archived: 'bg-muted-foreground/40',
};

const MAX_SURVEYS = 5;

interface PinnedProjectCardProps {
  project: ProjectDetail;
  overviewProject: OverviewProject;
}

export function PinnedProjectCard({ project, overviewProject }: PinnedProjectCardProps) {
  const t = useTranslations('dashboard.bento');
  const [isPending, startTransition] = useTransition();

  const totalResponses = overviewProject.responseCount;
  const totalSurveys = overviewProject.surveyCount;

  const completedCount = project.surveys.reduce((sum, s) => sum + s.completedCount, 0);
  const totalResponseCount = project.surveys.reduce((sum, s) => sum + s.responseCount, 0);
  const completionRate =
    totalResponseCount > 0 ? Math.round((completedCount / totalResponseCount) * 100) : null;

  const visibleSurveys = project.surveys.slice(0, MAX_SURVEYS);

  function handleUnpin() {
    startTransition(async () => {
      await setPinnedProject({ projectId: null });
    });
  }

  return (
    <Card
      className={cn(
        BENTO_CARD_CLASS,
        BENTO_ROW4_CARD_MIN_H,
        'border-border/50 flex h-full flex-col'
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {t('pinned.title')}
        </p>
        <Pin className="text-chart-violet size-4 shrink-0 fill-current" />
      </div>
      <div className="flex shrink-0 items-center gap-2.5 px-4 pt-2">
        <Pin className="text-muted-foreground size-3.5 shrink-0 fill-current" />

        <Link
          href={`/dashboard/projects/${project.project.id}`}
          className="min-w-0 shrink truncate text-base font-semibold hover:underline"
        >
          {project.project.name}
        </Link>

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleUnpin}
          disabled={isPending}
          className="ml-auto shrink-0"
          aria-label={t('pinned.unpin')}
        >
          <X className="size-3" />
        </Button>
      </div>

      <div className="flex shrink-0 items-center gap-2.5 px-4 pt-1.5">
        <span className="text-muted-foreground text-xs">
          {t('pinned.responses', { count: totalResponses })}
        </span>

        {completionRate !== null && (
          <>
            <span className="text-muted-foreground/40 text-xs">&middot;</span>
            <span className="text-muted-foreground text-xs">{completionRate}%</span>
          </>
        )}

        <span className="text-muted-foreground/40 text-xs">&middot;</span>
        <span className="text-muted-foreground text-xs">
          {t('pinned.surveys_count', { count: totalSurveys })}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden px-4 pt-2 pb-4">
        {visibleSurveys.length > 0 && (
          <>
            <p className="text-muted-foreground mb-2 text-xs font-medium">{t('pinned.surveys')}</p>
            <ul className="space-y-1.5 overflow-hidden">
              {visibleSurveys.map((survey) => (
                <SurveyRow key={survey.id} survey={survey} />
              ))}
            </ul>
          </>
        )}
      </div>
    </Card>
  );
}

function SurveyRow({ survey }: { survey: ProjectSurvey }) {
  const tBento = useTranslations('dashboard.bento');
  const dotColor = SURVEY_STATUS_DOT[survey.status] ?? 'bg-muted-foreground/40';

  return (
    <li className="flex items-center gap-2 text-xs">
      <span className={cn('size-1.5 shrink-0 rounded-full', dotColor)} aria-hidden />

      <Link href={getSurveyStatsUrl(survey.id)} className="min-w-0 flex-1 truncate hover:underline">
        {survey.title}
      </Link>

      <span className="text-muted-foreground shrink-0 tabular-nums">
        {tBento('pinned.responsesShort', { count: survey.responseCount })}
      </span>
    </li>
  );
}
