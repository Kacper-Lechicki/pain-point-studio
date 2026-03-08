'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ROUTES } from '@/config/routes';
import {
  useBreadcrumbSegment,
  useBreadcrumbTrail,
} from '@/features/dashboard/components/layout/breadcrumb-context';
import { useSubPanelLinks } from '@/features/dashboard/components/layout/sub-panel-items-context';
import { getProjectDetailUrl } from '@/features/projects/lib/project-urls';
import type { SurveyStats } from '@/features/surveys/actions/get-survey-stats';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { SurveyShareDialog } from '@/features/surveys/components/dashboard/survey-share-dialog';
import { SurveyStatsHeader } from '@/features/surveys/components/stats/survey-stats-header';
import { SurveyStatsTabs } from '@/features/surveys/components/stats/survey-stats-tabs';
import { deriveSurveyFlags, getAvailableActions } from '@/features/surveys/config/survey-status';
import {
  useRealtimeResponses,
  useSurveyAction,
  useSurveyCardActions,
} from '@/features/surveys/hooks';
import { getSurveyStatsUrl } from '@/features/surveys/lib/survey-urls';
import type { SurveyStatus } from '@/features/surveys/types';
import { useRefresh } from '@/hooks/common/use-refresh';

interface SurveyStatsPanelProps {
  stats: SurveyStats;
  survey: UserSurvey | null;
}

export const SurveyStatsPanel = ({ stats, survey }: SurveyStatsPanelProps) => {
  const t = useTranslations();
  const { isRefreshing, refresh, lastSyncedAt, markSynced } = useRefresh();

  const breadcrumbTrail = [
    { label: t('breadcrumbs.dashboard'), href: ROUTES.common.dashboard },
    { label: t('breadcrumbs.projects'), href: ROUTES.dashboard.projects },
    ...(survey?.projectId && survey?.projectName
      ? [{ label: survey.projectName, href: getProjectDetailUrl(survey.projectId) }]
      : []),
    { label: stats.survey.title, href: getSurveyStatsUrl(stats.survey.id) },
  ];

  useBreadcrumbTrail(breadcrumbTrail);
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

  const router = useRouter();
  const { shareUrl, shareDialogOpen, setShareDialogOpen, handleShare } = useSurveyCardActions(
    stats.survey.slug
  );

  const [optimisticStatus, setOptimisticStatus] = useState<SurveyStatus | null>(null);
  const currentStatus = optimisticStatus ?? stats.survey.status;
  const flags = useMemo(
    () => ({
      ...deriveSurveyFlags(currentStatus),
      hasShareableLink: !!shareUrl,
      questionCount: stats.questions?.length ?? 0,
    }),
    [currentStatus, shareUrl, stats.questions?.length]
  );
  const availableActions = useMemo(() => getAvailableActions(currentStatus), [currentStatus]);

  const onStatusChange = useMemo(
    () => (_surveyId: string, action: string) => {
      const statusMap: Partial<Record<string, SurveyStatus>> = {
        complete: 'completed',
        cancel: 'cancelled',
        reopen: 'active',
        archive: 'archived',
        trash: 'trashed',
      };
      const next = statusMap[action];

      if (next) {
        setOptimisticStatus(next);
      }

      router.refresh();
    },
    [router]
  );

  const {
    handleActionClick,
    confirmDialogProps,
    isPending: isActionPending,
  } = useSurveyAction(stats.survey.id, onStatusChange, t);

  const { isActive } = deriveSurveyFlags(currentStatus);
  const hasShareableLink = !!shareUrl;

  return (
    <main className="flex min-w-0 flex-col gap-3" aria-label={stats.survey.title}>
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
        flags={flags}
        availableActions={availableActions}
        onActionClick={handleActionClick}
      />

      <SurveyStatsTabs stats={stats} survey={survey} shareUrl={shareUrl} onShare={handleShare} />

      {hasShareableLink && shareUrl && (
        <SurveyShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          shareUrl={shareUrl}
          surveyTitle={stats.survey.title}
        />
      )}

      {confirmDialogProps && (
        <ConfirmDialog
          open={confirmDialogProps.open}
          onOpenChange={confirmDialogProps.onOpenChange}
          onConfirm={confirmDialogProps.onConfirm}
          title={confirmDialogProps.title}
          description={confirmDialogProps.description}
          confirmLabel={confirmDialogProps.confirmLabel}
          variant={confirmDialogProps.variant}
          isLoading={isActionPending}
        />
      )}
    </main>
  );
};
