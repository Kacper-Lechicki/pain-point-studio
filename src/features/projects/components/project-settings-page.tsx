'use client';

import { useEffect, useState } from 'react';

import { ChevronLeft, Settings, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ROUTES } from '@/config';
import { DASHBOARD_PAGE_BODY_GAP_TOP } from '@/config/layout';
import type { ProjectOwner } from '@/features/projects/actions/get-project';
import { ProjectSettingsForm } from '@/features/projects/components/project-settings-form';
import type { Project } from '@/features/projects/types';
import { useBreadcrumbSegment } from '@/hooks/common/use-breadcrumb';
import { useSubPanelLinks } from '@/hooks/common/use-sub-panel-items';
import type { MessageKey } from '@/i18n/types';

interface ProjectSettingsPageProps {
  project: Project;
  owner: ProjectOwner | null;
}

export function ProjectSettingsPage({ project: initialProject }: ProjectSettingsPageProps) {
  const t = useTranslations();
  const [project, setProject] = useState(initialProject);

  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

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

  const handleSaved = (data: {
    name: string;
    summary: string | undefined;
    imageUrl?: string | null;
  }) => {
    setProject((prev) => ({
      ...prev,
      name: data.name,
      summary: data.summary ?? null,
      ...(data.imageUrl !== undefined && { image_url: data.imageUrl }),
      updated_at: new Date().toISOString(),
    }));
  };

  return (
    <main className={`flex min-w-0 flex-col ${DASHBOARD_PAGE_BODY_GAP_TOP}`}>
      <ProjectSettingsForm project={project} onSaved={handleSaved} />
    </main>
  );
}
