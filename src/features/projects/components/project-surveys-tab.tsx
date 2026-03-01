'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { HeroHighlight } from '@/components/ui/hero-highlight';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { Project } from '@/features/projects/types';
import type { UserSurvey } from '@/features/surveys/actions';
import { SurveyList } from '@/features/surveys/components/dashboard/survey-list';

interface ProjectSurveysTabProps {
  project: Project;
  surveys: UserSurvey[];
  onCreateSurvey?: () => void;
}

export function ProjectSurveysTab({ project, surveys, onCreateSurvey }: ProjectSurveysTabProps) {
  const t = useTranslations();
  const isArchived = isProjectArchived(project);
  const totalResponses = surveys.reduce((sum, s) => sum + s.completedCount, 0);
  const effectiveCreateSurvey = !isArchived ? onCreateSurvey : undefined;

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
          {effectiveCreateSurvey && (
            <Button className="mt-4" onClick={effectiveCreateSurvey}>
              <Plus className="size-4" aria-hidden />
              {t('projects.detail.createSurvey')}
            </Button>
          )}
        </div>
      </HeroHighlight>
    );
  }

  return (
    <SurveyList
      initialSurveys={surveys}
      projectId={project.id}
      onCreateSurvey={effectiveCreateSurvey}
      totalResponses={totalResponses}
      targetResponses={project.target_responses}
    />
  );
}
