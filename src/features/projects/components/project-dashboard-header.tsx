'use client';

import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProjectActionButtons } from '@/features/projects/components/project-action-buttons';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import { PROJECT_CONTEXTS_CONFIG } from '@/features/projects/config/contexts';
import type { Project, ProjectContext, ProjectStatus } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';

interface ProjectDashboardHeaderProps {
  project: Project;
  surveyCount: number;
  totalResponses: number;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function ProjectDashboardHeader({
  project,
  surveyCount,
  totalResponses,
  onEdit,
  onArchive,
  onDelete,
}: ProjectDashboardHeaderProps) {
  const t = useTranslations();
  const isArchived = project.status === 'archived';
  const contextConfig = PROJECT_CONTEXTS_CONFIG[project.context as ProjectContext];

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-foreground min-w-0 text-2xl leading-tight font-bold md:text-3xl">
        {project.name}
      </h1>

      {project.description && (
        <p className="text-muted-foreground text-sm leading-relaxed">{project.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-[11px]">
          {t(contextConfig.labelKey as MessageKey)}
        </Badge>

        <ProjectStatusBadge status={project.status as ProjectStatus} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs">
          {t('projects.list.card.surveys', { count: surveyCount })}
        </span>

        <span className="text-border text-xs">·</span>

        <span className="text-muted-foreground text-xs">
          {t('projects.detail.responses', { count: totalResponses })}
        </span>
      </div>

      <Separator className="mt-2" />

      <ProjectActionButtons
        isArchived={isArchived}
        onEdit={onEdit}
        onArchive={onArchive}
        onDelete={onDelete}
      />
    </div>
  );
}
