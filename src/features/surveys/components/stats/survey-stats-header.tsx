'use client';

import { useState } from 'react';

import { MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { SurveyStatusBadge } from '@/components/shared/survey-status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RefreshRealtimeButton } from '@/components/ui/refresh-realtime-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { SurveyActionMenuContent } from '@/features/surveys/components/dashboard/survey-action-menu';
import { ExportDialog } from '@/features/surveys/components/stats/export-dialog';
import type { SurveyAction } from '@/features/surveys/config/survey-status';
import type { SurveyStatus } from '@/features/surveys/types';

interface SurveyStatsHeaderProps {
  title: string;
  description: string | null;
  status: SurveyStatus;
  surveyId: string;
  isActive: boolean;
  isRefreshing: boolean;
  isRealtimeConnected: boolean;
  lastSyncedAt: number;
  onRefresh: () => void;
  hasShareableLink: boolean;
  onShare: () => void;
  /** Same flags as list menu: Export/Edit/Publish visibility. */
  flags: {
    isDraft: boolean;
    isArchived: boolean;
    isTrashed: boolean;
    hasShareableLink: boolean;
    questionCount: number;
  };
  availableActions: SurveyAction[];
  onActionClick: (action: SurveyAction) => void;
}

export function SurveyStatsHeader({
  title,
  description,
  status,
  surveyId,
  isActive,
  isRefreshing,
  isRealtimeConnected,
  lastSyncedAt,
  onRefresh,
  onShare,
  flags,
  availableActions,
  onActionClick,
}: SurveyStatsHeaderProps) {
  const t = useTranslations();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const canExport = !flags.isDraft && !flags.isArchived;

  return (
    <>
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge
              labelKey="surveys.stats.contextBadge"
              descriptionKey="surveys.stats.contextBadgeDescription"
              ariaLabelKey="surveys.stats.contextBadgeAriaLabel"
              variant="secondary"
            />
            <SurveyStatusBadge status={status} />
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {isActive && (
              <RefreshRealtimeButton
                isRefreshing={isRefreshing}
                isRealtimeConnected={isRealtimeConnected}
                lastSyncedAt={lastSyncedAt}
                onRefresh={onRefresh}
                ariaLabel={t('surveys.stats.refresh')}
              />
            )}

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
                <SurveyActionMenuContent
                  surveyId={surveyId}
                  flags={flags}
                  availableActions={availableActions}
                  onShare={onShare}
                  onExport={canExport ? () => setExportDialogOpen(true) : undefined}
                  handleActionClick={onActionClick}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <h1 className="text-foreground mt-1 text-2xl leading-tight font-bold sm:text-3xl">
          {title}
        </h1>

        {description && (
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{description}</p>
        )}
      </div>

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        surveyId={surveyId}
        surveyTitle={title}
      />
    </>
  );
}
