'use client';

import { useMemo, useState, useTransition } from 'react';

import { Ban, CheckCircle2, Inbox, Link2, MoreHorizontal, Share2 } from 'lucide-react';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { RefreshRealtimeButton } from '@/components/ui/refresh-realtime-button';
import { Separator } from '@/components/ui/separator';
import { useBreadcrumbSegment } from '@/features/dashboard/components/layout/breadcrumb-context';
import { cancelSurvey, completeSurvey } from '@/features/surveys/actions';
import type { QuestionStats, SurveyStats } from '@/features/surveys/actions/get-survey-stats';
import { SurveyShareDialog } from '@/features/surveys/components/dashboard/survey-share-dialog';
import { SurveyStatusBadge } from '@/features/surveys/components/dashboard/survey-status-badge';
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
import { DeviceBreakdownChart } from './device-breakdown-chart';
import { ExportMenuItems } from './export-buttons';
import { QuestionStatsCard } from './question-stats-card';
import { ResponseTimelineChart } from './response-timeline-chart';

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
        {/* Header */}
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-foreground min-w-0 truncate text-3xl leading-tight font-bold">
              {stats.survey.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <SurveyStatusBadge status={currentStatus} />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <RefreshRealtimeButton
              isRefreshing={isRefreshing}
              isRealtimeConnected={isRealtimeConnected}
              onRefresh={refresh}
              ariaLabel={t('surveys.stats.refresh')}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground"
                  aria-label={t('surveys.stats.moreActions')}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hasShareableLink && (
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="size-4" aria-hidden />
                    {t('surveys.dashboard.actions.share')}
                  </DropdownMenuItem>
                )}

                <ExportMenuItems surveyId={stats.survey.id} />

                {(canComplete || canCancel) && <DropdownMenuSeparator />}

                {canComplete && (
                  <DropdownMenuItem variant="accent" onClick={() => setShowCompleteDialog(true)}>
                    <CheckCircle2 className="size-4" aria-hidden />
                    {t('surveys.stats.completeSurvey')}
                  </DropdownMenuItem>
                )}

                {canCancel && (
                  <DropdownMenuItem variant="destructive" onClick={() => setShowCancelDialog(true)}>
                    <Ban className="size-4" aria-hidden />
                    {t('surveys.stats.cancelSurvey')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

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

        {/* Charts */}
        {stats.completedResponses > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <SectionLabel>{t('surveys.stats.responseTimeline')}</SectionLabel>
              <ResponseTimelineChart data={stats.responseTimeline} className="h-48 w-full" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                  {t('surveys.stats.deviceBreakdown')}
                </p>
                <div className="flex items-center gap-2.5">
                  <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ backgroundColor: 'var(--chart-violet)' }}
                    />
                    {t('surveys.stats.deviceDesktop')}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ backgroundColor: 'var(--chart-cyan)' }}
                    />
                    {t('surveys.stats.deviceMobile')}
                  </span>
                </div>
              </div>
              <DeviceBreakdownChart data={stats.deviceTimeline} className="h-48 w-full" />
            </div>
          </div>
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
