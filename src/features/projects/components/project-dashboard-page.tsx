'use client';

import { useCallback, useState } from 'react';

import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ROUTES } from '@/config/routes';
import { useBreadcrumbSegment } from '@/features/dashboard/components/layout/breadcrumb-context';
import { useSubPanelLinks } from '@/features/dashboard/components/layout/sub-panel-items-context';
import { DASHBOARD_PAGE_BODY_GAP_TOP } from '@/features/dashboard/config/layout';
import { EditProjectDialog } from '@/features/projects/components/edit-project-dialog';
import { ProjectAboutSection } from '@/features/projects/components/project-about-section';
import { ProjectDetailHeader } from '@/features/projects/components/project-detail-header';
import { ProjectDetailTabs } from '@/features/projects/components/project-detail-tabs';
import { useProjectDashboardActions } from '@/features/projects/hooks/use-project-dashboard-actions';
import { deriveProjectPhase } from '@/features/projects/lib/project-helpers';
import type { Project, ProjectInsight, ProjectOverviewStats } from '@/features/projects/types';
import type { UserSurvey } from '@/features/surveys/actions';

interface ProjectDashboardPageProps {
  project: Project;
  surveys: UserSurvey[];
  insights: ProjectInsight[];
  overviewStats: ProjectOverviewStats;
}

export function ProjectDashboardPage({
  project: initialProject,
  surveys,
  insights: initialInsights,
  overviewStats,
}: ProjectDashboardPageProps) {
  const [insights, setInsights] = useState(initialInsights);

  const {
    project,
    editOpen,
    setEditOpen,
    confirmAction,
    setConfirmAction,
    handleEditSuccess,
    handleImageChange,
    handleConfirm,
    confirmDialogProps,
  } = useProjectDashboardActions({ initialProject });

  const t = useTranslations();

  useBreadcrumbSegment(project.id, project.name);

  useSubPanelLinks([
    {
      label: t('common.backToProjects'),
      href: ROUTES.dashboard.projects,
      icon: ChevronLeft,
    },
  ]);

  const phase = deriveProjectPhase(surveys);

  const handleInsightCreated = useCallback((insight: ProjectInsight) => {
    setInsights((prev) => [...prev, insight]);
  }, []);

  const handleInsightUpdated = useCallback((updated: ProjectInsight) => {
    setInsights((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }, []);

  const handleInsightDeleted = useCallback((insightId: string) => {
    setInsights((prev) => prev.filter((i) => i.id !== insightId));
  }, []);

  return (
    <main className="flex min-w-0 flex-col">
      <ProjectDetailHeader
        project={project}
        userId={project.user_id}
        phase={phase}
        onEdit={() => setEditOpen(true)}
        onArchive={() => setConfirmAction('archive')}
        onDelete={() => setConfirmAction('delete')}
        onImageChange={handleImageChange}
      />

      <div className={`${DASHBOARD_PAGE_BODY_GAP_TOP} flex flex-col gap-6`}>
        <ProjectAboutSection project={project} />
        <ProjectDetailTabs
          project={project}
          surveys={surveys}
          insights={insights}
          overviewStats={overviewStats}
          onInsightCreated={handleInsightCreated}
          onInsightUpdated={handleInsightUpdated}
          onInsightDeleted={handleInsightDeleted}
        />
      </div>

      <EditProjectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
        onSuccess={handleEditSuccess}
      />

      {confirmDialogProps && (
        <ConfirmDialog
          open={!!confirmAction}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmAction(null);
            }
          }}
          onConfirm={handleConfirm}
          title={confirmDialogProps.title}
          description={confirmDialogProps.description}
          confirmLabel={confirmDialogProps.confirmLabel}
          variant={confirmDialogProps.variant}
        />
      )}
    </main>
  );
}
