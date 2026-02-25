'use client';

import { useMemo, useState } from 'react';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { HeroHighlight } from '@/components/ui/hero-highlight';
import { SearchInput } from '@/components/ui/search-input';
import { ROUTES } from '@/config/routes';
import type { ProjectSurvey } from '@/features/projects/actions/get-project';
import { PhaseSection } from '@/features/projects/components/phase-section';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import { type Project, RESEARCH_PHASES, type ResearchPhase } from '@/features/projects/types';
import Link from '@/i18n/link';

interface ProjectSurveysTabProps {
  project: Project;
  surveys: ProjectSurvey[];
}

export function ProjectSurveysTab({ project, surveys }: ProjectSurveysTabProps) {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const isArchived = isProjectArchived(project);

  const isSearching = searchQuery.trim().length > 0;

  const filteredSurveys = useMemo(() => {
    if (!isSearching) {
      return surveys;
    }

    const q = searchQuery.trim().toLowerCase();

    return surveys.filter((s) => s.title.toLowerCase().includes(q));
  }, [surveys, searchQuery, isSearching]);

  const groupedSurveys = useMemo(() => {
    const groups: Record<ResearchPhase | 'unassigned', ProjectSurvey[]> = {
      idea: [],
      research: [],
      validation: [],
      decision: [],
      unassigned: [],
    };

    for (const survey of filteredSurveys) {
      const phase = survey.researchPhase as ResearchPhase | null;

      if (phase && RESEARCH_PHASES.includes(phase)) {
        groups[phase].push(survey);
      } else {
        groups.unassigned.push(survey);
      }
    }

    return groups;
  }, [filteredSurveys]);

  /** Total surveys per group (before search filter) — used for "X of Y" labels. */
  const totalCounts = useMemo(() => {
    const counts: Record<ResearchPhase | 'unassigned', number> = {
      idea: 0,
      research: 0,
      validation: 0,
      decision: 0,
      unassigned: 0,
    };

    for (const survey of surveys) {
      const phase = survey.researchPhase as ResearchPhase | null;

      if (phase && RESEARCH_PHASES.includes(phase)) {
        counts[phase]++;
      } else {
        counts.unassigned++;
      }
    }

    return counts;
  }, [surveys]);

  if (surveys.length === 0) {
    return (
      <HeroHighlight
        showDotsOnMobile={false}
        containerClassName="w-full rounded-lg border border-dashed border-border"
      >
        <div className="flex w-full flex-col items-center px-4 py-12 text-center md:py-16">
          <p className="text-foreground text-base font-medium">
            {t('projects.detail.empty.noSurveys')}
          </p>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            {t('projects.detail.empty.noSurveysDescription')}
          </p>
          {!isArchived && (
            <Button className="mt-4" asChild>
              <Link href={`${ROUTES.dashboard.researchNew}?projectId=${project.id}`}>
                <Plus className="size-4" aria-hidden />
                {t('projects.detail.createSurvey')}
              </Link>
            </Button>
          )}
        </div>
      </HeroHighlight>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('projects.detail.searchPlaceholder')}
          className="basis-full sm:max-w-sm sm:flex-1 sm:basis-auto"
        />
      </div>

      <div className="flex flex-col gap-8">
        {RESEARCH_PHASES.map((phase) => {
          const phaseSurveys = groupedSurveys[phase];

          if (isSearching && phaseSurveys.length === 0) {
            return null;
          }

          return (
            <PhaseSection
              key={phase}
              phase={phase}
              surveys={phaseSurveys}
              projectId={project.id}
              totalCount={totalCounts[phase]}
              isSearching={isSearching}
            />
          );
        })}

        {/* Unassigned surveys (no phase) */}
        {(!isSearching || groupedSurveys.unassigned.length > 0) && (
          <PhaseSection
            phase={null}
            surveys={groupedSurveys.unassigned}
            projectId={project.id}
            totalCount={totalCounts.unassigned}
            isSearching={isSearching}
            sectionTitle={t('projects.phases.unassigned')}
          />
        )}
      </div>
    </div>
  );
}
