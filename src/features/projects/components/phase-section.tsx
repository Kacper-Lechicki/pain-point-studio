'use client';

import { List, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { HeroHighlight } from '@/components/ui/hero-highlight';
import { ROUTES } from '@/config/routes';
import type { ProjectSurvey } from '@/features/projects/actions/get-project';
import { PhaseSurveyCard } from '@/features/projects/components/phase-survey-card';
import type { PhaseConfig } from '@/features/projects/config/contexts';
import { getSurveyDetailUrl } from '@/features/surveys/lib/survey-urls';
import Link from '@/i18n/link';
import type { MessageKey } from '@/i18n/types';

interface PhaseSectionProps {
  phase: PhaseConfig | null;
  surveys: ProjectSurvey[];
  sectionTitle?: string;
  totalCount?: number;
  isSearching?: boolean;
}

export function PhaseSection({
  phase,
  surveys,
  sectionTitle,
  totalCount,
  isSearching,
}: PhaseSectionProps) {
  const t = useTranslations();

  const Icon = phase?.icon ?? List;
  const title = phase ? t(phase.labelKey as MessageKey) : (sectionTitle ?? '');

  const countLabel =
    isSearching && totalCount !== undefined
      ? `(${surveys.length} of ${totalCount})`
      : `(${surveys.length})`;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon className="text-muted-foreground size-5 shrink-0" aria-hidden />
        <h2 className="text-foreground text-base font-semibold">{title}</h2>
        <span className="text-muted-foreground text-sm">{countLabel}</span>

        {!isSearching && (
          <Button variant="default" size="sm" className="ml-auto" asChild>
            <Link href={ROUTES.dashboard.researchNew}>
              <Plus className="size-4" aria-hidden />
              {t('projects.detail.createSurvey')}
            </Link>
          </Button>
        )}
      </div>

      {surveys.length > 0 ? (
        <div className="flex flex-col gap-2">
          {surveys.map((survey) => (
            <PhaseSurveyCard key={survey.id} survey={survey} href={getSurveyDetailUrl(survey.id)} />
          ))}
        </div>
      ) : isSearching ? (
        <p className="text-muted-foreground py-4 text-center text-sm">
          {t('projects.detail.noMatchingSurveys')}
        </p>
      ) : (
        <HeroHighlight
          showDotsOnMobile={false}
          containerClassName="w-full rounded-lg border border-dashed border-border"
        >
          <div className="flex w-full flex-col items-center px-4 py-10 text-center md:py-12">
            <p className="text-muted-foreground text-sm">{t('projects.detail.noSurveysInPhase')}</p>
          </div>
        </HeroHighlight>
      )}
    </section>
  );
}
