'use client';

import { useMemo, useState, useTransition } from 'react';

import { Inbox, Link2 } from 'lucide-react';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Separator } from '@/components/ui/separator';
import { useBreadcrumbSegment } from '@/features/dashboard/components/layout/breadcrumb-context';
import { cancelSurvey, completeSurvey } from '@/features/surveys/actions';
import type { QuestionStats, SurveyStats } from '@/features/surveys/actions/get-survey-stats';
import { SurveyShareDialog } from '@/features/surveys/components/dashboard/survey-share-dialog';
import { SectionLabel } from '@/features/surveys/components/shared/metric-display';
import { NOW_UPDATE_INTERVAL_MS } from '@/features/surveys/config';
import { deriveSurveyFlags } from '@/features/surveys/config/survey-status';
import { useRealtimeResponses } from '@/features/surveys/hooks/use-realtime-responses';
import { useSurveyCardActions } from '@/features/surveys/hooks/use-survey-card-actions';
import {
  calculateAvgQuestionCompletion,
  calculateRespondentProgress,
  calculateSubmissionRate,
} from '@/features/surveys/lib/calculations';
import type { SurveyStatus } from '@/features/surveys/types';
import { useRefresh } from '@/hooks/common/use-refresh';

import { DetailMetricsGrid } from './detail-metrics-grid';
import { QuestionStatsCard } from './question-stats-card';
import { SurveyStatsCharts } from './survey-stats-charts';
import { SurveyStatsHeader } from './survey-stats-header';

interface SurveyStatsPanelProps {
  stats: SurveyStats;
}

export const SurveyStatsPanel = ({ stats }: SurveyStatsPanelProps) => {
  const t = useTranslations();
  const format = useFormatter();
  const now = useNow({ updateInterval: NOW_UPDATE_INTERVAL_MS });
  const { isRefreshing, refresh } = useRefresh();

  useBreadcrumbSegment(stats.survey.id, stats.survey.title);
  const { isConnected: isRealtimeConnected } = useRealtimeResponses(stats.survey.id);
  const { shareUrl, shareDialogOpen, setShareDialogOpen, handleShare } = useSurveyCardActions(
    stats.survey.slug
  );

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<SurveyStatus | null>(null);
  const [, startTransition] = useTransition();

  const currentStatus = optimisticStatus ?? stats.survey.status;
  const { isActive } = deriveSurveyFlags(currentStatus);
  const canComplete = isActive;
  const canCancel = isActive;
  const hasShareableLink = !!shareUrl;

  const submissionRate = calculateSubmissionRate(stats.completedResponses, stats.totalResponses);
  const respondentProgress = calculateRespondentProgress(
    stats.completedResponses,
    stats.survey.maxRespondents
  );
  const avgQuestionCompletion = useMemo(
    () =>
      calculateAvgQuestionCompletion(
        stats.questions.map((q) => q.answers.length),
        stats.completedResponses
      ),
    [stats.questions, stats.completedResponses]
  );
  const lastResponseLabel =
    stats.lastResponseAt != null ? format.relativeTime(new Date(stats.lastResponseAt), now) : null;

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
    <main className="flex min-w-0 flex-col" aria-label={stats.survey.title}>
      <div className="space-y-6">
        <SurveyStatsHeader
          title={stats.survey.title}
          status={currentStatus}
          surveyId={stats.survey.id}
          isRefreshing={isRefreshing}
          isRealtimeConnected={isRealtimeConnected}
          onRefresh={refresh}
          hasShareableLink={hasShareableLink}
          onShare={handleShare}
          canComplete={canComplete}
          canCancel={canCancel}
          onComplete={() => setShowCompleteDialog(true)}
          onCancel={() => setShowCancelDialog(true)}
        />

        {/* Key metrics */}
        <DetailMetricsGrid
          completedCount={stats.completedResponses}
          responseCount={stats.totalResponses}
          maxRespondents={stats.survey.maxRespondents}
          submissionRate={submissionRate}
          avgQuestionCompletion={avgQuestionCompletion}
          avgCompletionSeconds={stats.avgCompletionSeconds}
          lastResponseLabel={lastResponseLabel}
          respondentProgress={respondentProgress}
          isActive={isActive}
          wide
        />

        {stats.completedResponses > 0 && (
          <SurveyStatsCharts
            responseTimeline={stats.responseTimeline}
            deviceTimeline={stats.deviceTimeline}
          />
        )}

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
          <>
            <Separator />
            <SectionLabel>{t('surveys.stats.questionBreakdown')}</SectionLabel>
            <div className="space-y-3">
              {stats.questions.map((q: QuestionStats, i: number) => (
                <QuestionStatsCard key={q.id} question={q} index={i} />
              ))}
            </div>
          </>
        )}
      </div>

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
