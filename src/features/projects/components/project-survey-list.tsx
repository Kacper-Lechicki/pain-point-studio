'use client';

import { List, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/routes';
import type { ProjectSurvey } from '@/features/projects/actions/get-project';
import type { PhaseConfig } from '@/features/projects/config/contexts';
import { SurveyStatusBadge } from '@/features/surveys/components/dashboard/survey-status-badge';
import { getSurveyDetailUrl } from '@/features/surveys/lib/survey-urls';
import type { SurveyStatus } from '@/features/surveys/types';
import Link from '@/i18n/link';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

const MAX_VISIBLE_SURVEYS_PER_PHASE = 5;

export function SurveysListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-muted/50 h-7 animate-pulse rounded" />
      ))}
    </div>
  );
}

interface CompactPhaseGroupProps {
  phase: PhaseConfig | null;
  surveys: ProjectSurvey[];
  totalCount: number;
  isSearching: boolean;
  label?: string | undefined;
}

export function CompactPhaseGroup({
  phase,
  surveys,
  totalCount,
  isSearching,
  label,
}: CompactPhaseGroupProps) {
  const t = useTranslations();
  const Icon = phase?.icon ?? List;
  const title = phase ? t(phase.labelKey as MessageKey) : (label ?? '');

  const countLabel =
    isSearching && totalCount > 0 ? `(${surveys.length}/${totalCount})` : `(${surveys.length})`;

  const visible = surveys.slice(0, MAX_VISIBLE_SURVEYS_PER_PHASE);
  const remaining = surveys.length - MAX_VISIBLE_SURVEYS_PER_PHASE;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
        <span className="text-foreground text-xs font-medium">{title}</span>
        <span className="text-muted-foreground text-[11px]">{countLabel}</span>

        {!isSearching && (
          <Button variant="default" size="sm" className="ml-auto h-6 px-2 text-[11px]" asChild>
            <Link href={ROUTES.dashboard.researchNew}>
              <Plus className="size-3" aria-hidden />
              {t('projects.detail.createSurvey')}
            </Link>
          </Button>
        )}
      </div>

      {surveys.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {visible.map((survey) => (
            <CompactSurveyRow key={survey.id} survey={survey} />
          ))}

          {remaining > 0 && (
            <span className="text-muted-foreground mt-0.5 pl-1.5 text-[11px]">
              +{remaining} more
            </span>
          )}
        </div>
      ) : isSearching ? (
        <p className="text-muted-foreground pl-5 text-[11px]">
          {t('projects.detail.noMatchingSurveys')}
        </p>
      ) : null}
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

  const visible = surveys.slice(0, MAX_VISIBLE_SURVEYS_PER_PHASE * 2);
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
