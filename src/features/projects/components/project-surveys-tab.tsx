'use client';

import { ClipboardList, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
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
      <EmptyState
        icon={ClipboardList}
        title={t('projects.detail.empty.noSurveys')}
        description={t('projects.detail.empty.noSurveysDescription')}
        accent="cyan"
        action={
          effectiveCreateSurvey ? (
            <Button onClick={effectiveCreateSurvey}>
              <Plus className="size-4" aria-hidden />
              {t('projects.detail.createSurvey')}
            </Button>
          ) : undefined
        }
      />
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
