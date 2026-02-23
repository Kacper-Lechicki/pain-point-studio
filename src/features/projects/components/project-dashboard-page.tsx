'use client';

import { useCallback, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SearchInput } from '@/components/ui/search-input';
import { ROUTES } from '@/config/routes';
import { useBreadcrumbSegment } from '@/features/dashboard/components/layout/breadcrumb-context';
import { DASHBOARD_PAGE_BODY_GAP_TOP } from '@/features/dashboard/config/layout';
import { archiveProject } from '@/features/projects/actions/archive-project';
import { deleteProject } from '@/features/projects/actions/delete-project';
import type { ProjectDetail, ProjectSurvey } from '@/features/projects/actions/get-project';
import type { SurveySignalData } from '@/features/projects/actions/get-project-signals-data';
import { EditProjectDialog } from '@/features/projects/components/edit-project-dialog';
import { PhaseSection } from '@/features/projects/components/phase-section';
import { ProjectDashboardHeader } from '@/features/projects/components/project-dashboard-header';
import { ProjectScorecard } from '@/features/projects/components/project-scorecard';
import { ValidationProgressStepper } from '@/features/projects/components/validation-progress-stepper';
import { PROJECT_CONTEXTS_CONFIG } from '@/features/projects/config/contexts';
import { computePhaseStatuses } from '@/features/projects/lib/phase-status';
import { generateSignals } from '@/features/projects/lib/signals';
import type { Project, ProjectContext, ProjectInsight } from '@/features/projects/types';
import { RESEARCH_PHASES } from '@/features/projects/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import { useRouter } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';

type ConfirmAction = 'archive' | 'delete';

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
  const t = useTranslations();
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [insights, setInsights] = useState(initialInsights);

  useBreadcrumbSegment(project.id, project.name);

  const archiveAction = useFormAction({
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const deleteAction = useFormAction({
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const totalResponses = useMemo(
    () => surveys.reduce((sum, s) => sum + s.responseCount, 0),
    [surveys]
  );

  const isSearching = searchQuery.trim().length > 0;

  const filteredSurveys = useMemo(() => {
    if (!isSearching) {
      return surveys;
    }

    const q = searchQuery.trim().toLowerCase();

    return surveys.filter((s) => s.title.toLowerCase().includes(q));
  }, [surveys, searchQuery, isSearching]);

  const filteredSurveysByPhase = useMemo(() => {
    if (!isSearching) {
      return surveysByPhase;
    }

    const q = searchQuery.trim().toLowerCase();
    const result: Record<string, ProjectSurvey[]> = {};

    for (const [phase, phaseSurveys] of Object.entries(surveysByPhase)) {
      result[phase] = phaseSurveys.filter((s) => s.title.toLowerCase().includes(q));
    }

    return result;
  }, [surveysByPhase, searchQuery, isSearching]);

  const handleEditSuccess = useCallback(
    (data: { name: string; description: string | undefined }) => {
      setProject((prev) => ({
        ...prev,
        name: data.name,
        description: data.description ?? null,
        updated_at: new Date().toISOString(),
      }));
    },
    []
  );

  const handleConfirm = useCallback(async () => {
    if (!confirmAction) {
      return;
    }

    if (confirmAction === 'archive') {
      const isArchived = project.status === 'archived';

      const successMsg = (
        isArchived ? 'projects.detail.restoreSuccess' : 'projects.detail.archiveSuccess'
      ) as MessageKey;

      setProject((prev) => ({
        ...prev,
        status: isArchived ? 'active' : 'archived',
        archived_at: isArchived ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      setConfirmAction(null);

      const result = await archiveAction.execute(archiveProject, { projectId: project.id });

      if (result && !result.error) {
        const { toast } = await import('sonner');
        toast.success(t(successMsg));
      } else {
        setProject(initialProject);
      }
    } else {
      setConfirmAction(null);

      const result = await deleteAction.execute(deleteProject, { projectId: project.id });

      if (result && !result.error) {
        const { toast } = await import('sonner');
        toast.success(t('projects.detail.deleteSuccess' as MessageKey));
        router.push(ROUTES.dashboard.projects);
      }
    }
  }, [confirmAction, project, initialProject, archiveAction, deleteAction, t, router]);

  const confirmDialogProps = useMemo(() => {
    if (!confirmAction) {
      return null;
    }

    const isArchived = project.status === 'archived';

    if (confirmAction === 'archive') {
      return {
        title: t(
          isArchived ? 'projects.list.confirm.restoreTitle' : 'projects.list.confirm.archiveTitle'
        ),
        description: t(
          isArchived
            ? 'projects.list.confirm.restoreDescription'
            : 'projects.list.confirm.archiveDescription'
        ),
        confirmLabel: t(
          isArchived ? 'projects.list.confirm.restoreAction' : 'projects.list.confirm.archiveAction'
        ),
        variant: 'default' as const,
      };
    }

    return {
      title: t('projects.list.confirm.deleteTitle'),
      description: t('projects.list.confirm.deleteDescription'),
      confirmLabel: t('projects.list.confirm.deleteAction'),
      variant: 'destructive' as const,
    };
  }, [confirmAction, project.status, t]);

  const isIdeaValidation = project.context === 'idea_validation';
  const contextConfig = PROJECT_CONTEXTS_CONFIG[project.context as ProjectContext];

  const phaseStatuses = useMemo(
    () => (isIdeaValidation ? computePhaseStatuses(surveysByPhase) : null),
    [isIdeaValidation, surveysByPhase]
  );

  const signalsByPhase = useMemo(
    () => (isIdeaValidation ? generateSignals(signalsData, RESEARCH_PHASES) : {}),
    [isIdeaValidation, signalsData]
  );

  // Aggregate auto-signals across all phases for the scorecard (strength + threat only)
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

  // Split insights: phase=null → scorecard, phase!=null → phase sections
  const { scorecardInsights, insightsByPhase } = useMemo(() => {
    const scorecard: ProjectInsight[] = [];
    const byPhase: Record<string, ProjectInsight[]> = {};

    for (const insight of insights) {
      if (insight.phase === null) {
        scorecard.push(insight);
      } else {
        const phase = insight.phase;

        if (!byPhase[phase]) {
          byPhase[phase] = [];
        }

        byPhase[phase]!.push(insight);
      }
    }

    return { scorecardInsights: scorecard, insightsByPhase: byPhase };
  }, [insights]);

  // Insight CRUD callbacks
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
      <ProjectDashboardHeader
        project={project}
        surveyCount={surveys.length}
        totalResponses={totalResponses}
        onEdit={() => setEditOpen(true)}
        onArchive={() => setConfirmAction('archive')}
        onDelete={() => setConfirmAction('delete')}
      />

      <div className={`${DASHBOARD_PAGE_BODY_GAP_TOP} flex flex-col gap-6`}>
        {phaseStatuses && <ValidationProgressStepper phaseStatuses={phaseStatuses} />}

        {isIdeaValidation && (
          <ProjectScorecard
            projectId={project.id}
            signals={scorecardSignals}
            insights={scorecardInsights}
            onInsightCreated={handleInsightCreated}
            onInsightUpdated={handleInsightUpdated}
            onInsightDeleted={handleInsightDeleted}
          />
        )}

        {surveys.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('projects.detail.searchPlaceholder')}
              className="basis-full sm:max-w-sm sm:flex-1 sm:basis-auto"
            />
          </div>
        )}

        <div className="flex flex-col gap-8">
          {isIdeaValidation ? (
            <>
              {contextConfig.phases.map((phase) => (
                <PhaseSection
                  key={phase.value}
                  phase={phase}
                  surveys={filteredSurveysByPhase[phase.value] ?? []}
                  projectId={project.id}
                  signals={signalsByPhase[phase.value]}
                  insights={insightsByPhase[phase.value]}
                  totalCount={(surveysByPhase[phase.value] ?? []).length}
                  isSearching={isSearching}
                  onInsightCreated={handleInsightCreated}
                  onInsightUpdated={handleInsightUpdated}
                  onInsightDeleted={handleInsightDeleted}
                />
              ))}

              {(surveysByPhase['unassigned']?.length ?? 0) > 0 && (
                <PhaseSection
                  phase={null}
                  surveys={filteredSurveysByPhase['unassigned'] ?? []}
                  projectId={project.id}
                  totalCount={(surveysByPhase['unassigned'] ?? []).length}
                  isSearching={isSearching}
                  sectionTitle={t('projects.detail.unassigned')}
                />
              )}
            </>
          ) : (
            <PhaseSection
              phase={null}
              surveys={filteredSurveys}
              projectId={project.id}
              totalCount={surveys.length}
              isSearching={isSearching}
              sectionTitle={t('projects.detail.allSurveys')}
            />
          )}
        </div>
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
