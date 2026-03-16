'use client';

import { MousePointerClick, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { RefreshRealtimeButton } from '@/components/ui/refresh-realtime-button';
import type { SurveyStatusFilter } from '@/features/surveys/components/dashboard/survey-list-toolbar';
import { KPI_COLOR_ALL, SURVEY_STATUS_CONFIG } from '@/features/surveys/config/survey-status';
import { cn } from '@/lib/common/utils';

interface SurveyListKpiProps {
  statusCounts: Record<string, number>;
  kpiStatuses: SurveyStatusFilter[];
  hasActiveSurveys: boolean;
  isRefreshing: boolean;
  isRealtimeConnected: boolean;
  lastSyncedAt: number;
  onRefresh: () => void;
  /** When true, shows project-level response usage and create button. */
  isProjectContext?: boolean | undefined;
  /** Total responses across all surveys in this project. */
  totalResponses?: number | undefined;
  /** Project-level target responses cap. */
  responseLimit?: number | undefined;
  /** Callback to open the "create survey" dialog (shown in project context). */
  onCreateSurvey?: (() => void) | undefined;
}

export function SurveyListKpi({
  statusCounts,
  kpiStatuses,
  hasActiveSurveys,
  isRefreshing,
  isRealtimeConnected,
  lastSyncedAt,
  onRefresh,
  isProjectContext,
  totalResponses,
  responseLimit,
  onCreateSurvey,
}: SurveyListKpiProps) {
  const t = useTranslations();

  if (kpiStatuses.length === 0) {
    return null;
  }

  const total = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);

  return (
    <section className="flex min-w-0 flex-col gap-3">
      {/* KPI pills – wrap cleanly on any width */}
      <div className="flex min-w-0 flex-wrap gap-2">
        <span
          className={cn(
            'border-border/60 bg-muted/40 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs tabular-nums',
            KPI_COLOR_ALL
          )}
        >
          <span className="font-semibold">{total}</span>
          <span className="text-muted-foreground">{t('surveys.dashboard.summary.totalLabel')}</span>
        </span>
        {kpiStatuses.map((status) => (
          <span
            key={status}
            className={cn(
              'border-border/60 bg-muted/40 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs tabular-nums',
              SURVEY_STATUS_CONFIG[status].kpiColor
            )}
          >
            <span className="font-semibold">{statusCounts[status] ?? 0}</span>
            <span className="text-muted-foreground">
              {t(`surveys.dashboard.status.${status}` as Parameters<typeof t>[0])}
            </span>
          </span>
        ))}
        {isProjectContext && responseLimit != null && responseLimit > 0 && (
          <span className="text-muted-foreground border-border/60 bg-muted/40 inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs tabular-nums">
            <span className="text-foreground font-semibold">{totalResponses ?? 0}</span>
            <span>/</span>
            <span>{responseLimit}</span>
            <span>{t('surveys.dashboard.responseUsageLabel')}</span>
          </span>
        )}
      </div>

      {/* Actions row: hint left, primary action right */}
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]" aria-hidden>
          <MousePointerClick className="size-3 shrink-0" />
          {t('surveys.dashboard.clickHint')}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          {isProjectContext && onCreateSurvey && (
            <Button size="sm" onClick={onCreateSurvey}>
              <Plus className="size-4" aria-hidden />
              {t('projects.detail.createSurvey')}
            </Button>
          )}
          {hasActiveSurveys && !isProjectContext && (
            <RefreshRealtimeButton
              isRefreshing={isRefreshing}
              isRealtimeConnected={isRealtimeConnected}
              lastSyncedAt={lastSyncedAt}
              onRefresh={onRefresh}
              ariaLabel={t('surveys.dashboard.refresh')}
            />
          )}
        </div>
      </div>
    </section>
  );
}
