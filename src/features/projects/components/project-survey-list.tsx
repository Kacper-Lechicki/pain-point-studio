'use client';

import { useTranslations } from 'next-intl';

import type { ProjectSurvey } from '@/features/projects/actions/get-project';
import { SurveyStatusBadge } from '@/features/surveys/components/dashboard/survey-status-badge';
import { getSurveyDetailUrl } from '@/features/surveys/lib/survey-urls';
import type { SurveyStatus } from '@/features/surveys/types';
import Link from '@/i18n/link';
import { cn } from '@/lib/common/utils';

const MAX_VISIBLE_SURVEYS = 10;

export function SurveysListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-muted/50 h-7 animate-pulse rounded" />
      ))}
    </div>
  );
}

interface CompactSurveyListProps {
  surveys: ProjectSurvey[];
  isSearching: boolean;
}

export function CompactSurveyList({ surveys, isSearching }: CompactSurveyListProps) {
  const t = useTranslations();

  if (surveys.length === 0 && isSearching) {
    return (
      <p className="text-muted-foreground py-2 text-center text-xs">
        {t('projects.detail.noMatchingSurveys')}
      </p>
    );
  }

  const visible = surveys.slice(0, MAX_VISIBLE_SURVEYS);
  const remaining = surveys.length - visible.length;

  return (
    <div className="flex flex-col gap-1.5">
      {visible.map((survey) => (
        <CompactSurveyRow key={survey.id} survey={survey} />
      ))}

      {remaining > 0 && (
        <span className="text-muted-foreground mt-1 text-xs">+{remaining} more</span>
      )}
    </div>
  );
}

function CompactSurveyRow({ survey }: { survey: ProjectSurvey }) {
  return (
    <Link
      href={getSurveyDetailUrl(survey.id)}
      className={cn(
        'border-border/50 flex min-w-0 items-center justify-between gap-2 rounded-md border border-dashed p-2 transition-colors',
        'hover:bg-muted/50 focus-visible:ring-ring/20 focus-visible:ring-2 focus-visible:outline-none'
      )}
    >
      <span className="text-foreground min-w-0 truncate text-xs">{survey.title}</span>

      <SurveyStatusBadge status={survey.status as SurveyStatus} />
    </Link>
  );
}
