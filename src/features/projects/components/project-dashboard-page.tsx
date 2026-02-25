'use client';

import { useCallback, useMemo, useState } from 'react';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useBreadcrumbSegment } from '@/features/dashboard/components/layout/breadcrumb-context';
import { DASHBOARD_PAGE_BODY_GAP_TOP } from '@/features/dashboard/config/layout';
import type { ProjectSurvey } from '@/features/projects/actions/get-project';
import type { SurveySignalData } from '@/features/projects/actions/get-project-signals-data';
import { EditProjectDialog } from '@/features/projects/components/edit-project-dialog';
import { ProjectDetailHeader } from '@/features/projects/components/project-detail-header';
import { ProjectDetailKpi } from '@/features/projects/components/project-detail-kpi';
import { ProjectDetailTabs } from '@/features/projects/components/project-detail-tabs';
import { useProjectDashboardActions } from '@/features/projects/hooks/use-project-dashboard-actions';
import { generateFindings } from '@/features/projects/lib/signals';
import type { Project, ProjectInsight } from '@/features/projects/types';

interface ProjectDashboardPageProps {
  project: Project;
  surveys: ProjectSurvey[];
  signalsData: SurveySignalData[];
  insights: ProjectInsight[];
}

export function ProjectDashboardPage({
  project: initialProject,
  surveys,
  signalsData,
  insights: initialInsights,
}: ProjectDashboardPageProps) {
  const [insights, setInsights] = useState(initialInsights);

  const {
    project,
    editOpen,
    setEditOpen,
    confirmAction,
    setConfirmAction,
    handleEditSuccess,
    handleConfirm,
    confirmDialogProps,
  } = useProjectDashboardActions({ initialProject });

  useBreadcrumbSegment(project.id, project.name);

  const totalResponses = useMemo(
    () => surveys.reduce((sum, s) => sum + s.responseCount, 0),
    [surveys]
  );

  const allFindings = useMemo(() => generateFindings(signalsData), [signalsData]);

  const scorecardInsights = useMemo(() => insights, [insights]);

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
        onEdit={() => setEditOpen(true)}
        onArchive={() => setConfirmAction('archive')}
        onDelete={() => setConfirmAction('delete')}
      />

      <div className={`${DASHBOARD_PAGE_BODY_GAP_TOP} flex flex-col gap-6`}>
        <ProjectDetailKpi surveys={surveys} totalResponses={totalResponses} insights={insights} />

        <ProjectDetailTabs
          project={project}
          surveys={surveys}
          allFindings={allFindings}
          insights={insights}
          scorecardInsights={scorecardInsights}
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
