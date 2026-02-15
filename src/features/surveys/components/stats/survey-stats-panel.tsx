'use client';

import { useState, useTransition } from 'react';

import { Ban, CheckCircle2, Inbox, Link2, RefreshCw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Separator } from '@/components/ui/separator';
import { useBreadcrumbSegment } from '@/features/dashboard/components/layout/breadcrumb-context';
import { cancelSurvey, completeSurvey } from '@/features/surveys/actions';
import type { QuestionStats, SurveyStats } from '@/features/surveys/actions/get-survey-stats';
import { SurveyStatusBadge } from '@/features/surveys/components/dashboard/survey-status-badge';
import { SectionLabel } from '@/features/surveys/components/shared/metric-display';
import { useRealtimeResponses } from '@/features/surveys/hooks/use-realtime-responses';
import { getSurveyShareUrl } from '@/features/surveys/lib/share-url';
import type { SurveyStatus } from '@/features/surveys/types';
import { useRefresh } from '@/hooks/common/use-refresh';
import { cn } from '@/lib/common/utils';

import { ExportButtons } from './export-buttons';
import { QuestionStatsCard } from './question-stats-card';

interface SurveyStatsPanelProps {
  stats: SurveyStats;
}

export const SurveyStatsPanel = ({ stats }: SurveyStatsPanelProps) => {
  const t = useTranslations();
  const locale = useLocale();
  const { isRefreshing, refresh } = useRefresh();

  useBreadcrumbSegment(stats.survey.id, stats.survey.title);
  const { isConnected: isRealtimeConnected } = useRealtimeResponses(stats.survey.id);

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<SurveyStatus | null>(null);
  const [, startTransition] = useTransition();

  const currentStatus = optimisticStatus ?? stats.survey.status;
  const canComplete = currentStatus === 'active';
  const canCancel = currentStatus === 'active';

  const shareUrl = stats.survey.slug ? getSurveyShareUrl(locale, stats.survey.slug) : null;

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

  const handleCopyEmpty = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('surveys.stats.linkCopied'));
    }
  };

  return (
    <main className="flex min-w-0 flex-col" aria-label={stats.survey.title}>
      <div className="space-y-6">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-foreground min-w-0 truncate text-3xl leading-tight font-bold">
              {stats.survey.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <SurveyStatusBadge status={currentStatus} />
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={isRefreshing}
                className="gap-1.5"
              >
                <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} aria-hidden />
                {t('surveys.stats.refresh')}
              </Button>
              <span
                className={cn(
                  'absolute -top-px -right-px size-1.5 rounded-full',
                  isRealtimeConnected ? 'bg-emerald-500' : 'bg-amber-500'
                )}
                aria-hidden
              />
            </div>
            {canComplete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompleteDialog(true)}
                className="gap-1.5"
              >
                <CheckCircle2 className="size-3.5" aria-hidden />
                {t('surveys.stats.completeSurvey')}
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
      </div>

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
