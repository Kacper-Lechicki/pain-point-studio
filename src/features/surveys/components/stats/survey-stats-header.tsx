'use client';

import { useMemo, useState } from 'react';

import { Ban, CheckCircle2, Download, MoreHorizontal, Share2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
import { ExportDialog } from '@/features/surveys/components/stats/export-dialog';
import type { SurveyStatus } from '@/features/surveys/types';

interface SurveyStatsHeaderProps {
  title: string;
  status: SurveyStatus;
  surveyId: string;
  isActive: boolean;
  isRefreshing: boolean;
  isRealtimeConnected: boolean;
  lastSyncedAt: number;
  onRefresh: () => void;
  hasShareableLink: boolean;
  onShare: () => void;
  canComplete: boolean;
  canCancel: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

interface MenuItem {
  key: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'destructive' | 'accent';
}

export function SurveyStatsHeader({
  title,
  status,
  surveyId,
  isActive,
  isRefreshing,
  isRealtimeConnected,
  lastSyncedAt,
  onRefresh,
  hasShareableLink,
  onShare,
  canComplete,
  canCancel,
  onComplete,
  onCancel,
}: SurveyStatsHeaderProps) {
  const t = useTranslations();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const primaryItems = useMemo(() => {
    const items: MenuItem[] = [];

    if (hasShareableLink) {
      items.push({
        key: 'share',
        label: t('surveys.dashboard.actions.share'),
        icon: Share2,
        onClick: onShare,
      });
    }

    items.push({
      key: 'export',
      label: t('surveys.stats.export'),
      icon: Download,
      onClick: () => setExportDialogOpen(true),
    });

    return items.sort((a, b) => a.label.localeCompare(b.label));
  }, [t, hasShareableLink, onShare]);

  const statusActions = useMemo(() => {
    const items: MenuItem[] = [];

    if (canComplete) {
      items.push({
        key: 'complete',
        label: t('surveys.stats.completeSurvey'),
        icon: CheckCircle2,
        onClick: onComplete,
        variant: 'accent',
      });
    }

    if (canCancel) {
      items.push({
        key: 'cancel',
        label: t('surveys.stats.cancelSurvey'),
        icon: Ban,
        onClick: onCancel,
        variant: 'destructive',
      });
    }

    return items.sort((a, b) => a.label.localeCompare(b.label));
  }, [t, canComplete, canCancel, onComplete, onCancel]);

  return (
    <>
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
              {primaryItems.map((item) => (
                <DropdownMenuItem key={item.key} onClick={item.onClick}>
                  <item.icon className="size-4" aria-hidden />
                  {item.label}
                </DropdownMenuItem>
              ))}

              {statusActions.length > 0 && (
                <>
                  <DropdownMenuSeparator />

                  {statusActions.map((item) => (
                    <DropdownMenuItem
                      key={item.key}
                      {...(item.variant ? { variant: item.variant } : {})}
                      onClick={item.onClick}
                    >
                      <item.icon className="size-4" aria-hidden />
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
