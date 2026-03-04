'use client';

import { useState, useTransition } from 'react';

import { ChevronLeft, Inbox, Link2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionLabel } from '@/components/ui/metric-display';
import { useBreadcrumbSegment } from '@/features/dashboard/components/layout/breadcrumb-context';
import { useSubPanelLinks } from '@/features/dashboard/components/layout/sub-panel-items-context';
import { getProjectDetailUrl } from '@/features/projects/lib/project-urls';
import { cancelSurvey, completeSurvey } from '@/features/surveys/actions';
import type { QuestionStats, SurveyStats } from '@/features/surveys/actions/get-survey-stats';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { SurveyShareDialog } from '@/features/surveys/components/dashboard/survey-share-dialog';
import { DetailMetricsGrid } from '@/features/surveys/components/stats/detail-metrics-grid';
import { QuestionStatsCard } from '@/features/surveys/components/stats/question-stats-card';
import {
  CompletionRateCard,
  DeviceBreakdownCard,
  ResponseTimelineCard,
} from '@/features/surveys/components/stats/survey-stats-charts';
import { SurveyStatsDetailInfo } from '@/features/surveys/components/stats/survey-stats-detail-info';
import { SurveyStatsHeader } from '@/features/surveys/components/stats/survey-stats-header';
import { deriveSurveyFlags } from '@/features/surveys/config/survey-status';
import { useRealtimeResponses, useSurveyCardActions } from '@/features/surveys/hooks';
import {
  calculateAvgQuestionCompletion,
  calculateRespondentProgress,
  calculateSubmissionRate,
} from '@/features/surveys/lib/calculations';
import type { SurveyStatus } from '@/features/surveys/types';
import { useRefresh } from '@/hooks/common/use-refresh';

interface SurveyStatsPanelProps {
  stats: SurveyStats;
  survey: UserSurvey | null;
}

export const SurveyStatsPanel = ({ stats, survey }: SurveyStatsPanelProps) => {
  const t = useTranslations();
  const { isRefreshing, refresh, lastSyncedAt, markSynced } = useRefresh();

  useBreadcrumbSegment(stats.survey.id, stats.survey.title);

  useSubPanelLinks(
    survey
      ? [
          {
            label: t('common.backToProject'),
            href: getProjectDetailUrl(survey.projectId),
            icon: ChevronLeft,
          },
        ]
      : []
  );

  const initialIsActive = deriveSurveyFlags(stats.survey.status).isActive;

  const { isConnected: isRealtimeConnected } = useRealtimeResponses(
    stats.survey.id,
    markSynced,
    initialIsActive
  );

  const { shareUrl, shareDialogOpen, setShareDialogOpen, handleShare } = useSurveyCardActions(
    stats.survey.slug
  );

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<SurveyStatus | null>(null);
  const [, startTransition] = useTransition();
  const currentStatus = optimisticStatus ?? stats.survey.status;
  const { isActive } = deriveSurveyFlags(currentStatus);
  const hasShareableLink = !!shareUrl;
  const submissionRate = calculateSubmissionRate(stats.completedResponses, stats.totalResponses);

  const respondentProgress = calculateRespondentProgress(
    stats.completedResponses,
    stats.survey.maxRespondents
  );

  const avgQuestionCompletion = calculateAvgQuestionCompletion(
    stats.questions.map((q) => q.answers.length),
    stats.completedResponses
  );

  const handleCompleteSurvey = () => {
    startTransition(async () => {
      const result = await completeSurvey({ surveyId: stats.survey.id });

      if (result.success) {
        setOptimisticStatus('completed');
        toast.success(t('surveys.stats.surveyCompleted'));
      }

      setShowCompleteDialog(false);
    });
  };

  const handleCancelSurvey = () => {
    startTransition(async () => {
      const result = await cancelSurvey({ surveyId: stats.survey.id });

      if (result.success) {
        setOptimisticStatus('cancelled');
        toast.success(t('surveys.stats.surveyCancelled'));
      }

      setShowCancelDialog(false);
    });
  };

  return (
    <main className="flex min-w-0 flex-col gap-3" aria-label={stats.survey.title}>
      {/* 1. Header */}
      <SurveyStatsHeader
        title={stats.survey.title}
        description={survey?.description ?? null}
        status={currentStatus}
        surveyId={stats.survey.id}
        isActive={isActive}
        isRefreshing={isRefreshing}
        isRealtimeConnected={isRealtimeConnected}
        lastSyncedAt={lastSyncedAt}
        onRefresh={refresh}
        hasShareableLink={hasShareableLink}
        onShare={handleShare}
        canComplete={isActive}
        canCancel={isActive}
        onComplete={() => setShowCompleteDialog(true)}
        onCancel={() => setShowCancelDialog(true)}
      />

      {/* 2. Hero KPI Row */}
      <DetailMetricsGrid
        viewCount={stats.viewCount}
        completedCount={stats.completedResponses}
        maxRespondents={stats.survey.maxRespondents}
        submissionRate={submissionRate}
        avgCompletionSeconds={stats.avgCompletionSeconds}
        respondentProgress={respondentProgress}
      />

      {/* 3. Charts + Details */}
      {stats.completedResponses > 0 && (
        <ResponseTimelineCard responseTimeline={stats.responseTimeline} />
      )}

      {(stats.completedResponses > 0 || survey) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {survey && (
            <SurveyStatsDetailInfo
              survey={survey}
              responseCount={stats.totalResponses}
              avgQuestionCompletion={avgQuestionCompletion}
            />
          )}

          {stats.completedResponses > 0 && (
            <>
              <CompletionRateCard
                completionBreakdown={{
                  completed: stats.completedResponses,
                  inProgress: stats.inProgressResponses,
                  abandoned: Math.max(
                    0,
                    stats.totalResponses - stats.completedResponses - stats.inProgressResponses
                  ),
                }}
              />
              <DeviceBreakdownCard deviceTimeline={stats.deviceTimeline} />
            </>
          )}
        </div>
      )}

      {/* 4. Question Breakdown */}
      {stats.completedResponses === 0 ? (
        <EmptyState
          icon={Inbox}
          title={t('surveys.stats.noResponses')}
          description={t('surveys.stats.noResponsesDescription')}
          action={
            shareUrl ? (
              <Button size="sm" onClick={handleShare} className="gap-1.5">
                <Link2 className="size-4" aria-hidden />
                {t('surveys.stats.copySurveyLink')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="mt-12">
          <SectionLabel>{t('surveys.stats.questionBreakdown')}</SectionLabel>

          <div className="space-y-3">
            {stats.questions.map((q: QuestionStats, i: number) => (
              <QuestionStatsCard key={q.id} question={q} index={i} />
            ))}
          </div>
        </div>
      )}

      {hasShareableLink && shareUrl && (
        <SurveyShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          shareUrl={shareUrl}
          surveyTitle={stats.survey.title}
        />
      )}

      <ConfirmDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        onConfirm={handleCompleteSurvey}
        title={t('surveys.stats.completeSurvey')}
        description={t('surveys.stats.completeSurveyConfirm')}
        confirmLabel={t('surveys.stats.completeSurvey')}
      />

      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancelSurvey}
        title={t('surveys.stats.cancelSurvey')}
        description={t('surveys.stats.cancelSurveyConfirm')}
        confirmLabel={t('surveys.stats.cancelSurvey')}
        variant="destructive"
      />
    </main>
  );
};
