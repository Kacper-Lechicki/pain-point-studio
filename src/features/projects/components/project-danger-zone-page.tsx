'use client';

import { ChevronLeft, Settings, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ROUTES } from '@/config';
import { DASHBOARD_PAGE_BODY_GAP_TOP } from '@/config/layout';
import { ProjectDangerZone } from '@/features/projects/components/project-danger-zone';
import type { Project } from '@/features/projects/types';
import { useBreadcrumbSegment } from '@/hooks/common/use-breadcrumb';
import { useSubPanelLinks } from '@/hooks/common/use-sub-panel-items';
import type { MessageKey } from '@/i18n/types';

interface ProjectDangerZonePageProps {
  project: Project;
}

export function ProjectDangerZonePage({ project }: ProjectDangerZonePageProps) {
  const t = useTranslations();

  useBreadcrumbSegment(project.id, project.name);

  useSubPanelLinks({
    links: [
      {
        label: t('common.backToProject'),
        href: `${ROUTES.dashboard.projects}/${project.id}`,
        icon: ChevronLeft,
      },
    ],
    bottomLinks: [
      {
        label: t('projects.settings.generalTitle'),
        href: `${ROUTES.dashboard.projects}/${project.id}/settings`,
        icon: Settings,
      },
      {
        label: t('projects.settings.dangerZone.title'),
        href: `${ROUTES.dashboard.projects}/${project.id}/settings/danger-zone`,
        icon: Trash2,
      },
    ],
    titleKey: 'projects.settings.title' as MessageKey,
  });

  return (
    <main className={`flex min-w-0 flex-col ${DASHBOARD_PAGE_BODY_GAP_TOP}`}>
      <ProjectDangerZone projectId={project.id} projectName={project.name} />
    </main>
  );
}
