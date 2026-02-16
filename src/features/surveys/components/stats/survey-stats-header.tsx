'use client';

import { Ban, CheckCircle2, MoreHorizontal, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RefreshRealtimeButton } from '@/components/ui/refresh-realtime-button';
import { SurveyStatusBadge } from '@/features/surveys/components/dashboard/survey-status-badge';
import { ExportMenuItems } from '@/features/surveys/components/stats/export-buttons';
import type { SurveyStatus } from '@/features/surveys/types';

interface SurveyStatsHeaderProps {
  title: string;
  status: SurveyStatus;
  surveyId: string;
  isRefreshing: boolean;
  isRealtimeConnected: boolean;
  onRefresh: () => void;
  hasShareableLink: boolean;
  onShare: () => void;
  canComplete: boolean;
  canCancel: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

export function SurveyStatsHeader({
  title,
  status,
  surveyId,
  isRefreshing,
  isRealtimeConnected,
  onRefresh,
  hasShareableLink,
  onShare,
  canComplete,
  canCancel,
  onComplete,
  onCancel,
}: SurveyStatsHeaderProps) {
  const t = useTranslations();

  return (
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-foreground min-w-0 truncate text-3xl leading-tight font-bold">
          {title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <SurveyStatusBadge status={status} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <RefreshRealtimeButton
          isRefreshing={isRefreshing}
          isRealtimeConnected={isRealtimeConnected}
          onRefresh={onRefresh}
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
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="size-4" aria-hidden />
                {t('surveys.dashboard.actions.share')}
              </DropdownMenuItem>
            )}

            <ExportMenuItems surveyId={surveyId} />

            {(canComplete || canCancel) && <DropdownMenuSeparator />}

            {canComplete && (
              <DropdownMenuItem variant="accent" onClick={onComplete}>
                <CheckCircle2 className="size-4" aria-hidden />
                {t('surveys.stats.completeSurvey')}
              </DropdownMenuItem>
            )}

            {canCancel && (
              <DropdownMenuItem variant="destructive" onClick={onCancel}>
                <Ban className="size-4" aria-hidden />
                {t('surveys.stats.cancelSurvey')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
