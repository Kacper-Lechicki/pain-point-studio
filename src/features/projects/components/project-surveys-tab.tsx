'use client';

import type { ReactNode } from 'react';

import { FlaskConical, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { Project } from '@/features/projects/types';

interface ProjectSurveysTabProps {
  project: Project;
  hasSurveys: boolean;
  onCreateSurvey?: () => void;
  children: ReactNode;
}

export function ProjectSurveysTab({
  project,
  hasSurveys,
  onCreateSurvey,
  children,
}: ProjectSurveysTabProps) {
  const t = useTranslations();
  const isArchived = isProjectArchived(project);
  const effectiveCreateSurvey = !isArchived ? onCreateSurvey : undefined;

  if (!hasSurveys) {
    return (
      <EmptyState
        icon={FlaskConical}
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

  return <>{children}</>;
}
