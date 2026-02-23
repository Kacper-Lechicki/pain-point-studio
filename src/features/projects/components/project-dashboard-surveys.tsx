'use client';

import { useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { SearchInput } from '@/components/ui/search-input';
import type { ProjectDetail, ProjectSurvey } from '@/features/projects/actions/get-project';
import { PhaseSection } from '@/features/projects/components/phase-section';
import { PROJECT_CONTEXTS_CONFIG } from '@/features/projects/config/contexts';
import type { Project, ProjectContext, ProjectInsight, Signal } from '@/features/projects/types';

interface ProjectDashboardSurveysProps {
  project: Project;
  surveys: ProjectSurvey[];
  surveysByPhase: ProjectDetail['surveysByPhase'];
  signalsByPhase: Record<string, Signal[]>;
  insightsByPhase: Record<string, ProjectInsight[]>;
  onInsightCreated: (insight: ProjectInsight) => void;
  onInsightUpdated: (updated: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
}

export function ProjectDashboardSurveys({
  project,
  surveys,
  surveysByPhase,
  signalsByPhase,
  insightsByPhase,
  onInsightCreated,
  onInsightUpdated,
  onInsightDeleted,
}: ProjectDashboardSurveysProps) {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');

  const isSearching = searchQuery.trim().length > 0;
  const isIdeaValidation = project.context === 'idea_validation';
  const contextConfig = PROJECT_CONTEXTS_CONFIG[project.context as ProjectContext];

  const filteredSurveys = useMemo(() => {
    if (!isSearching) {
      return surveys;
    }

    const q = searchQuery.trim().toLowerCase();

    return surveys.filter((s) => s.title.toLowerCase().includes(q));
  }, [surveys, searchQuery, isSearching]);

  const filteredSurveysByPhase = useMemo(() => {
    if (!isSearching) {
      return surveysByPhase;
    }

    const q = searchQuery.trim().toLowerCase();
    const result: Record<string, ProjectSurvey[]> = {};

    for (const [phase, phaseSurveys] of Object.entries(surveysByPhase)) {
      result[phase] = phaseSurveys.filter((s) => s.title.toLowerCase().includes(q));
    }

    return result;
  }, [surveysByPhase, searchQuery, isSearching]);

  return (
    <>
      {surveys.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('projects.detail.searchPlaceholder')}
            className="basis-full sm:max-w-sm sm:flex-1 sm:basis-auto"
          />
        </div>
      )}

      <div className="flex flex-col gap-8">
        {isIdeaValidation ? (
          <>
            {contextConfig.phases.map((phase) => (
              <PhaseSection
                key={phase.value}
                phase={phase}
                surveys={filteredSurveysByPhase[phase.value] ?? []}
                projectId={project.id}
                signals={signalsByPhase[phase.value]}
                insights={insightsByPhase[phase.value]}
                totalCount={(surveysByPhase[phase.value] ?? []).length}
                isSearching={isSearching}
                onInsightCreated={onInsightCreated}
                onInsightUpdated={onInsightUpdated}
                onInsightDeleted={onInsightDeleted}
              />
            ))}

            {(surveysByPhase['unassigned']?.length ?? 0) > 0 && (
              <PhaseSection
                phase={null}
                surveys={filteredSurveysByPhase['unassigned'] ?? []}
                projectId={project.id}
                totalCount={(surveysByPhase['unassigned'] ?? []).length}
                isSearching={isSearching}
                sectionTitle={t('projects.detail.unassigned')}
              />
            )}
          </>
        ) : (
          <PhaseSection
            phase={null}
            surveys={filteredSurveys}
            projectId={project.id}
            totalCount={surveys.length}
            isSearching={isSearching}
            sectionTitle={t('projects.detail.allSurveys')}
          />
        )}
      </div>
    </>
  );
}
