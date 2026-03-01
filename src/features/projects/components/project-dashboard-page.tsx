'use client';

import { useCallback, useState } from 'react';

import { ChevronLeft, Plus, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ROUTES } from '@/config/routes';
import { useBreadcrumbSegment } from '@/features/dashboard/components/layout/breadcrumb-context';
import { useSubPanelLinks } from '@/features/dashboard/components/layout/sub-panel-items-context';
import { DASHBOARD_PAGE_BODY_GAP_TOP } from '@/features/dashboard/config/layout';
import type { ProjectOwner } from '@/features/projects/actions/get-project';
import { EditProjectDialog } from '@/features/projects/components/edit-project-dialog';
import { ProjectDetailHeader } from '@/features/projects/components/project-detail-header';
import { ProjectDetailTabs } from '@/features/projects/components/project-detail-tabs';
import { useProjectDashboardActions } from '@/features/projects/hooks/use-project-dashboard-actions';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import { deriveProjectPhase } from '@/features/projects/lib/project-helpers';
import type { Project, ProjectInsight, ProjectOverviewStats } from '@/features/projects/types';
import type { UserSurvey } from '@/features/surveys/actions';
import { getCreateSurveyUrl } from '@/features/surveys/lib/survey-urls';
import { useRefresh } from '@/hooks/common/use-refresh';

import { useRealtimeProject } from '../hooks/use-realtime-project';

interface ProjectDashboardPageProps {
  project: Project;
  owner: ProjectOwner | null;
  surveys: UserSurvey[];
  insights: ProjectInsight[];
  overviewStats: ProjectOverviewStats;
}

export function ProjectDashboardPage({
  project: initialProject,
  owner,
  surveys,
  insights: initialInsights,
  overviewStats,
}: ProjectDashboardPageProps) {
  const [insights, setInsights] = useState(initialInsights);

  const { isRefreshing, refresh, lastSyncedAt, markSynced } = useRefresh();
  const hasActiveSurveys = surveys.some((s) => s.status === 'active');
  const { isConnected: isRealtimeConnected } = useRealtimeProject(markSynced, hasActiveSurveys);

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

  const isArchived = isProjectArchived(project);

  useSubPanelLinks(
    [
      {
        label: t('common.backToProjects'),
        href: ROUTES.dashboard.projects,
        icon: ChevronLeft,
      },
    ],
    [
      ...(!isArchived
        ? [
            {
              label: t('projects.detail.createSurvey'),
              href: getCreateSurveyUrl(project.id),
              icon: Plus,
            },
          ]
        : []),
      {
        label: t('projects.detail.settings'),
        href: '#',
        icon: Settings,
        disabled: true,
      },
    ]
  );

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
        owner={owner}
        phase={phase}
        onEdit={() => setEditOpen(true)}
        onArchive={() => setConfirmAction('archive')}
        onDelete={() => setConfirmAction('delete')}
        lastResponseAt={overviewStats.lastResponseAt}
        onImageChange={handleImageChange}
        onEditSuccess={handleEditSuccess}
        isRefreshing={isRefreshing}
        isRealtimeConnected={isRealtimeConnected}
        lastSyncedAt={lastSyncedAt}
        onRefresh={refresh}
        hasActiveSurveys={hasActiveSurveys}
      />

      <div className={`${DASHBOARD_PAGE_BODY_GAP_TOP} flex min-w-0 flex-col gap-6`}>
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
