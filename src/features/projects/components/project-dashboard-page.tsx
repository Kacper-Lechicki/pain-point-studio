'use client';

import { useCallback, useMemo, useState } from 'react';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useBreadcrumbSegment } from '@/features/dashboard/components/layout/breadcrumb-context';
import { DASHBOARD_PAGE_BODY_GAP_TOP } from '@/features/dashboard/config/layout';
import type { ProjectDetail, ProjectSurvey } from '@/features/projects/actions/get-project';
import type { SurveySignalData } from '@/features/projects/actions/get-project-signals-data';
import { EditProjectDialog } from '@/features/projects/components/edit-project-dialog';
import { ProjectDetailHeader } from '@/features/projects/components/project-detail-header';
import { ProjectDetailKpi } from '@/features/projects/components/project-detail-kpi';
import { ProjectDetailTabs } from '@/features/projects/components/project-detail-tabs';
import { ValidationProgressStepper } from '@/features/projects/components/validation-progress-stepper';
import { useProjectDashboardActions } from '@/features/projects/hooks/use-project-dashboard-actions';
import { computePhaseStatuses } from '@/features/projects/lib/phase-status';
import { generateSignals } from '@/features/projects/lib/signals';
import type { Project, ProjectInsight } from '@/features/projects/types';
import { RESEARCH_PHASES } from '@/features/projects/types';

interface ProjectDashboardPageProps {
  project: Project;
  surveys: ProjectSurvey[];
  surveysByPhase: ProjectDetail['surveysByPhase'];
  signalsData: SurveySignalData[];
  insights: ProjectInsight[];
}

export function ProjectDashboardPage({
  project: initialProject,
  surveys,
  surveysByPhase,
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

  const isIdeaValidation = project.context === 'idea_validation';

  const phaseStatuses = useMemo(
    () => (isIdeaValidation ? computePhaseStatuses(surveysByPhase) : null),
    [isIdeaValidation, surveysByPhase]
  );

  const signalsByPhase = useMemo(
    () => (isIdeaValidation ? generateSignals(signalsData, RESEARCH_PHASES) : {}),
    [isIdeaValidation, signalsData]
  );

  const scorecardSignals = useMemo(() => {
    if (!isIdeaValidation) {
      return { strengths: [], threats: [] };
    }

    const allSignals = Object.values(signalsByPhase).flat();

    return {
      strengths: allSignals.filter((s) => s.type === 'strength'),
      threats: allSignals.filter((s) => s.type === 'threat' && s.source !== 'no_data'),
    };
  }, [isIdeaValidation, signalsByPhase]);

  const scorecardInsights = useMemo(() => insights.filter((i) => i.phase === null), [insights]);

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
        <ProjectDetailKpi
          surveys={surveys}
          totalResponses={totalResponses}
          scorecardSignals={scorecardSignals}
          insights={insights}
          isIdeaValidation={isIdeaValidation}
        />

        {phaseStatuses && <ValidationProgressStepper phaseStatuses={phaseStatuses} />}

        <ProjectDetailTabs
          project={project}
          surveys={surveys}
          surveysByPhase={surveysByPhase}
          scorecardSignals={scorecardSignals}
          signalsByPhase={signalsByPhase}
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
