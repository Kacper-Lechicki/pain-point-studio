'use client';

import { useState, useTransition } from 'react';

import { Ban, Calendar, CheckCircle2, Inbox, Link2 } from 'lucide-react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ClipboardInput } from '@/components/ui/clipboard-input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Separator } from '@/components/ui/separator';
import { useBreadcrumbSegment } from '@/features/dashboard/components/layout/breadcrumb-context';
import { cancelSurvey, closeSurvey } from '@/features/surveys/actions';
import type { QuestionStats, SurveyStats } from '@/features/surveys/actions/get-survey-stats';
import { SurveyStatusBadge } from '@/features/surveys/components/dashboard/survey-status-badge';
import { MetricRow, SectionLabel } from '@/features/surveys/components/shared/metric-display';
import { ResponseTimelineChart } from '@/features/surveys/components/shared/response-timeline-chart';
import { DATE_FORMAT_SHORT } from '@/features/surveys/config';
import { useRealtimeResponses } from '@/features/surveys/hooks/use-realtime-responses';
import {
  calculateCompletionRate,
  calculateRespondentProgress,
  formatCompletionTime,
} from '@/features/surveys/lib/calculations';
import { getSurveyShareUrl } from '@/features/surveys/lib/share-url';
import type { SurveyStatus } from '@/features/surveys/types';

import { ExportButtons } from './export-buttons';
import { QuestionStatsCard } from './question-stats-card';
import { StatsMetricsGrid } from './stats-metrics-grid';

interface SurveyStatsPanelProps {
  stats: SurveyStats;
}

export const SurveyStatsPanel = ({ stats }: SurveyStatsPanelProps) => {
  const t = useTranslations();
  const locale = useLocale();
  const format = useFormatter();

  useBreadcrumbSegment(stats.survey.id, stats.survey.title);
  useRealtimeResponses(stats.survey.id);

  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<SurveyStatus | null>(null);
  const [, startTransition] = useTransition();

  const currentStatus = optimisticStatus ?? stats.survey.status;
  const canClose = currentStatus === 'active';
  const canCancel = currentStatus === 'active' || currentStatus === 'pending';

  const shareUrl = stats.survey.slug ? getSurveyShareUrl(locale, stats.survey.slug) : null;
  const completionTimeLabel = formatCompletionTime(stats.avgCompletionSeconds);

  const handleCloseSurvey = () => {
    startTransition(async () => {
      const result = await closeSurvey({ surveyId: stats.survey.id });

      if (result.success) {
        setOptimisticStatus('closed');
        toast.success(t('surveys.stats.surveyClosed'));
      }

      setShowCloseDialog(false);
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

  const completionRate = calculateCompletionRate(stats.completedResponses, stats.totalResponses);

  const respondentProgress = calculateRespondentProgress(
    stats.completedResponses,
    stats.survey.maxRespondents
  );

  const formatDate = (iso: string) => format.dateTime(new Date(iso), DATE_FORMAT_SHORT);

  const hasDetails = stats.survey.startsAt != null || stats.survey.endsAt != null;

  const handleCopyEmpty = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('surveys.stats.linkCopied'));
    }
  };

  return (
    <main className="flex min-w-0 flex-col" aria-label={stats.survey.title}>
      <div className="space-y-6">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-foreground min-w-0 truncate text-3xl leading-tight font-bold">
                {stats.survey.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <SurveyStatusBadge status={currentStatus} />
                {currentStatus === 'active' && (
                  <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                    </span>
                    {t('surveys.stats.liveIndicator')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              {canClose && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCloseDialog(true)}
                  className="gap-1.5"
                >
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  {t('surveys.stats.closeSurvey')}
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelDialog(true)}
                  className="gap-1.5"
                >
                  <Ban className="size-3.5" aria-hidden />
                  {t('surveys.stats.cancelSurvey')}
                </Button>
              )}
              <ExportButtons surveyId={stats.survey.id} />
            </div>
          </div>

          {shareUrl && (
            <>
              <Separator />
              <SectionLabel>{t('surveys.stats.surveyLink')}</SectionLabel>
              <div className="flex items-center gap-2">
                <Link2 className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <ClipboardInput value={shareUrl} className="max-w-md" />
              </div>
            </>
          )}
        </div>

        <Separator />

        <SectionLabel>{t('surveys.stats.metricsLabel')}</SectionLabel>
        <StatsMetricsGrid
          totalResponses={stats.totalResponses}
          completedResponses={stats.completedResponses}
          inProgressResponses={stats.inProgressResponses}
          maxRespondents={stats.survey.maxRespondents}
          completionRate={completionRate}
          respondentProgress={respondentProgress}
          completionTimeLabel={completionTimeLabel}
        />

        {stats.responseTimeline.length > 0 && stats.responseTimeline.some((v) => v > 0) && (
          <>
            <Separator />
            <SectionLabel>{t('surveys.stats.responseTimeline')}</SectionLabel>
            <ResponseTimelineChart data={stats.responseTimeline} />
          </>
        )}

        {stats.completedResponses === 0 ? (
          <EmptyState
            icon={Inbox}
            title={t('surveys.stats.noResponses')}
            description={t('surveys.stats.noResponsesDescription')}
            action={
              shareUrl ? (
                <Button size="sm" onClick={handleCopyEmpty} className="gap-1.5">
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
                <QuestionStatsCard
                  key={q.id}
                  question={q}
                  index={i}
                  completedResponses={stats.completedResponses}
                />
              ))}
            </div>
          </>
        )}

        {hasDetails && (
          <>
            <Separator />
            <SectionLabel>{t('surveys.stats.detailsLabel')}</SectionLabel>
            <div className="space-y-2">
              {stats.survey.startsAt != null && (
                <MetricRow
                  icon={Calendar}
                  label={t('surveys.stats.startsAt')}
                  value={formatDate(stats.survey.startsAt)}
                />
              )}
              {stats.survey.endsAt != null && (
                <MetricRow
                  icon={Calendar}
                  label={t('surveys.stats.endsAt')}
                  value={formatDate(stats.survey.endsAt)}
                />
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        onConfirm={handleCloseSurvey}
        title={t('surveys.stats.closeSurvey')}
        description={t('surveys.stats.closeSurveyConfirm')}
        confirmLabel={t('surveys.stats.closeSurvey')}
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
