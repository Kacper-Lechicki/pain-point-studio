'use client';

import { useEffect, useState } from 'react';

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
import { ProjectDetailHeader } from '@/features/projects/components/project-detail-header';
import { ProjectDetailTabs } from '@/features/projects/components/project-detail-tabs';
import type { ProjectAction } from '@/features/projects/config/status';
import { PROJECT_ACTION_UI, getAvailableActions } from '@/features/projects/config/status';
import { useProjectDashboardActions } from '@/features/projects/hooks/use-project-dashboard-actions';
import { useRealtimeProject } from '@/features/projects/hooks/use-realtime-project';
import { isProjectReadOnly } from '@/features/projects/lib/project-helpers';
import type {
  Project,
  ProjectInsight,
  ProjectNoteFolder,
  ProjectNoteMeta,
  ProjectOverviewStats,
  ProjectStatus,
} from '@/features/projects/types';
import { SurveyList } from '@/features/surveys/components/dashboard/survey-list';
import type { UserSurvey } from '@/features/surveys/types';
import { useBreadcrumbSegment } from '@/hooks/common/use-breadcrumb';
import { useRecentItems } from '@/hooks/common/use-recent-items';
import { useRefresh } from '@/hooks/common/use-refresh';
import type { SubPanelAction } from '@/hooks/common/use-sub-panel-items';
import { useSubPanelLinks } from '@/hooks/common/use-sub-panel-items';
import type { MessageKey } from '@/i18n/types';
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

  const { project, confirmAction, setConfirmAction, handleConfirm, confirmDialogProps } =
    useProjectDashboardActions({ initialProject });

  const t = useTranslations();

  useBreadcrumbSegment(project.id, project.name);

  const { track: trackRecentProject } = useRecentItems('project');

  useEffect(() => {
    trackRecentProject(project.id);
  }, [project.id, trackRecentProject]);

  const readOnly = isProjectReadOnly(project);
  const availableActions = getAvailableActions(project.status as ProjectStatus);

  const quickActions: SubPanelAction[] = availableActions.map((action) => {
    const ui = PROJECT_ACTION_UI[action];
    const Icon = ui.icon;

    return {
      label: t(`projects.list.actions.${action}` as MessageKey),
      icon: Icon,
      onClick: () => setConfirmAction(action as ProjectAction),
      variant: ui.menuItemVariant ?? 'default',
    };
  });

  useSubPanelLinks({
    links: [
      {
        label: t('common.backToProjects'),
        href: ROUTES.dashboard.projects,
        icon: ChevronLeft,
      },
    ],
    bottomLinks: !readOnly
      ? [
          {
            label: t('projects.detail.createSurvey'),
            href: getCreateSurveyUrl(project.id),
            icon: Plus,
          },
        ]
      : [],
    footerLinks: [
      {
        label: t('projects.detail.settings'),
        href: `${ROUTES.dashboard.projects}/${project.id}/settings`,
        icon: Settings,
      },
    ],
    actions: quickActions,
  });

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
      responseLimit={project.response_limit}
    />
  );

  return (
    <main className="flex min-w-0 flex-col">
      <ProjectDetailHeader
        project={project}
        owner={owner}
        onAction={setConfirmAction}
        lastResponseAt={overviewStats.lastResponseAt}
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
