'use client';

import { useState, useTransition } from 'react';

import {
  Ban,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  Hash,
  Inbox,
  Link2,
  Timer,
} from 'lucide-react';
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

interface SurveyStatsPanelProps {
  stats: SurveyStats;
}

export const SurveyStatsPanel = ({ stats }: SurveyStatsPanelProps) => {
  const t = useTranslations('surveys.stats');
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
        toast.success(t('surveyClosed'));
      }

      setShowCloseDialog(false);
    });
  };

  const handleCancelSurvey = () => {
    startTransition(async () => {
      const result = await cancelSurvey({ surveyId: stats.survey.id });

      if (result.success) {
        setOptimisticStatus('cancelled');
        toast.success(t('surveyCancelled'));
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
      toast.success(t('linkCopied'));
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
                    {t('liveIndicator')}
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
                  {t('closeSurvey')}
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
                  {t('cancelSurvey')}
                </Button>
              )}
              <ExportButtons surveyId={stats.survey.id} />
            </div>
          </div>

          {shareUrl && (
            <>
              <Separator />
              <SectionLabel>{t('surveyLink')}</SectionLabel>
              <div className="flex items-center gap-2">
                <Link2 className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <ClipboardInput value={shareUrl} className="max-w-md" />
              </div>
            </>
          )}
        </div>

        <Separator />

        <SectionLabel>{t('metricsLabel')}</SectionLabel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="border-border/50 rounded-md border px-3 py-2.5">
            <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
              {stats.totalResponses}
            </div>
            <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-[11px]">
              <Hash className="size-3" aria-hidden />
              {t('totalResponses')}
            </div>
          </div>
          <div className="border-border/50 rounded-md border px-3 py-2.5">
            <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
              {stats.completedResponses}
              {stats.survey.maxRespondents != null && (
                <span className="text-muted-foreground text-xs font-normal">
                  {' '}
                  / {stats.survey.maxRespondents}
                </span>
              )}
            </div>
            <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-[11px]">
              <CheckCircle className="size-3" aria-hidden />
              {t('completedResponses')}
            </div>
            {respondentProgress != null && (
              <div className="bg-muted mt-2 h-1 w-full overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${respondentProgress}%` }}
                />
              </div>
            )}
          </div>
          <div className="border-border/50 rounded-md border px-3 py-2.5">
            <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
              {stats.inProgressResponses}
            </div>
            <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-[11px]">
              <Clock className="size-3" aria-hidden />
              {t('inProgress')}
            </div>
            {stats.inProgressResponses > 0 && (
              <p className="text-muted-foreground mt-1 text-[10px]">{t('inProgressHint')}</p>
            )}
          </div>
          {completionRate !== null && (
            <div className="border-border/50 rounded-md border px-3 py-2.5">
              <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
                {completionRate}%
              </div>
              <div className="text-muted-foreground mt-1.5 text-[11px]">{t('completionRate')}</div>
            </div>
          )}
          {completionTimeLabel != null && (
            <div className="border-border/50 rounded-md border px-3 py-2.5">
              <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
                {completionTimeLabel}
              </div>
              <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-[11px]">
                <Timer className="size-3" aria-hidden />
                {t('avgCompletionTime')}
              </div>
            </div>
          )}
        </div>

        {stats.responseTimeline.length > 0 && stats.responseTimeline.some((v) => v > 0) && (
          <>
            <Separator />
            <SectionLabel>{t('responseTimeline')}</SectionLabel>
            <ResponseTimelineChart data={stats.responseTimeline} />
          </>
        )}

        {stats.completedResponses === 0 ? (
          <EmptyState
            icon={Inbox}
            title={t('noResponses')}
            description={t('noResponsesDescription')}
            action={
              shareUrl ? (
                <Button size="sm" onClick={handleCopyEmpty} className="gap-1.5">
                  <Link2 className="size-4" aria-hidden />
                  {t('copySurveyLink')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Separator />
            <SectionLabel>{t('questionBreakdown')}</SectionLabel>
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
            <SectionLabel>{t('detailsLabel')}</SectionLabel>
            <div className="space-y-2">
              {stats.survey.startsAt != null && (
                <MetricRow
                  icon={Calendar}
                  label={t('startsAt')}
                  value={formatDate(stats.survey.startsAt)}
                />
              )}
              {stats.survey.endsAt != null && (
                <MetricRow
                  icon={Calendar}
                  label={t('endsAt')}
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
        title={t('closeSurvey')}
        description={t('closeSurveyConfirm')}
        confirmLabel={t('closeSurvey')}
      />

      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancelSurvey}
        title={t('cancelSurvey')}
        description={t('cancelSurveyConfirm')}
        confirmLabel={t('cancelSurvey')}
        variant="destructive"
      />
    </main>
  );
};
