'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { ChevronLeft, Plus, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DASHBOARD_PAGE_BODY_GAP_TOP } from '@/config/layout';
import { ROUTES } from '@/config/routes';
import type { InsightSuggestionsResult } from '@/features/projects/actions/get-insight-suggestions';
import type { PendingInsightSurvey } from '@/features/projects/actions/get-pending-insight-surveys';
import type { ProjectOwner } from '@/features/projects/actions/get-project';
import type { SurveySignalData } from '@/features/projects/actions/get-project-signals-data';
import { EditProjectDialog } from '@/features/projects/components/edit-project-dialog';
import { ProjectDetailHeader } from '@/features/projects/components/project-detail-header';
import { ProjectDetailTabs } from '@/features/projects/components/project-detail-tabs';
import { useProjectDashboardActions } from '@/features/projects/hooks/use-project-dashboard-actions';
import { useRealtimeProject } from '@/features/projects/hooks/use-realtime-project';
import { isProjectReadOnly } from '@/features/projects/lib/project-helpers';
import type {
  Project,
  ProjectInsight,
  ProjectNoteFolder,
  ProjectNoteMeta,
  ProjectOverviewStats,
} from '@/features/projects/types';
import { SurveyList } from '@/features/surveys/components/dashboard/survey-list';
import type { UserSurvey } from '@/features/surveys/types';
import { useBreadcrumbSegment } from '@/hooks/common/use-breadcrumb';
import { useRefresh } from '@/hooks/common/use-refresh';
import { useSubPanelLinks } from '@/hooks/common/use-sub-panel-items';
import { getCreateSurveyUrl } from '@/lib/common/urls/survey-urls';

interface ProjectDashboardPageProps {
  project: Project;
  owner: ProjectOwner | null;
  surveys: UserSurvey[];
  insights: ProjectInsight[];
  notesMeta: ProjectNoteMeta[];
  noteFolders: ProjectNoteFolder[];
  overviewStats: ProjectOverviewStats;
  signalsData: SurveySignalData[];
  suggestionsData: InsightSuggestionsResult;
  pendingSurveys: PendingInsightSurvey[];
}

export function ProjectDashboardPage({
  project: initialProject,
  owner,
  surveys,
  insights: initialInsights,
  notesMeta,
  noteFolders,
  overviewStats,
  signalsData,
  suggestionsData,
  pendingSurveys,
}: ProjectDashboardPageProps) {
  const [insights, setInsights] = useState(initialInsights);
  const router = useRouter();

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

  const readOnly = isProjectReadOnly(project);

  useSubPanelLinks(
    [
      {
        label: t('common.backToProjects'),
        href: ROUTES.dashboard.projects,
        icon: ChevronLeft,
      },
    ],
    [
      ...(!readOnly
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

  const handleInsightCreated = (insight: ProjectInsight) => {
    setInsights((prev) => [...prev, insight]);
  };

  const handleInsightUpdated = (updated: ProjectInsight) => {
    setInsights((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleInsightDeleted = (insightId: string) => {
    setInsights((prev) => prev.filter((i) => i.id !== insightId));
  };

  const handleInsightsChanged = (newInsights: ProjectInsight[]) => {
    setInsights(newInsights);
  };

  const totalResponses = surveys.reduce((sum, s) => sum + s.completedCount, 0);

  const surveyListSlot = (
    <SurveyList
      initialSurveys={surveys}
      projectId={project.id}
      onCreateSurvey={!readOnly ? () => router.push(getCreateSurveyUrl(project.id)) : undefined}
      totalResponses={totalResponses}
      targetResponses={project.target_responses}
    />
  );

  return (
    <main className="flex min-w-0 flex-col">
      <ProjectDetailHeader
        project={project}
        userId={project.user_id}
        owner={owner}
        onEdit={() => setEditOpen(true)}
        onAction={setConfirmAction}
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
          surveyListSlot={surveyListSlot}
          insights={insights}
          notesMeta={notesMeta}
          noteFolders={noteFolders}
          overviewStats={overviewStats}
          signalsData={signalsData}
          suggestionsData={suggestionsData}
          pendingSurveys={pendingSurveys}
          onInsightCreated={handleInsightCreated}
          onInsightUpdated={handleInsightUpdated}
          onInsightDeleted={handleInsightDeleted}
          onInsightsChanged={handleInsightsChanged}
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
