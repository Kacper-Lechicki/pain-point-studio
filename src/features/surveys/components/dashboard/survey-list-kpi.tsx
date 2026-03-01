import { Plus } from 'lucide-react';
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
  targetResponses?: number | undefined;
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
  targetResponses,
  onCreateSurvey,
}: SurveyListKpiProps) {
  const t = useTranslations();

  if (kpiStatuses.length === 0) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 text-xs">
        <span>
          <span className={cn('text-base font-semibold tabular-nums', KPI_COLOR_ALL)}>
            {Object.values(statusCounts).reduce((sum, n) => sum + n, 0)}
          </span>

          <span className="ml-1">{t('surveys.dashboard.summary.totalLabel')}</span>
        </span>

        <span className="text-border" aria-hidden>
          /
        </span>

        {kpiStatuses.map((status, i) => (
          <span key={status} className="flex shrink-0 items-center gap-x-3">
            {i > 0 && (
              <span className="text-border" aria-hidden>
                /
              </span>
            )}

            <span>
              <span
                className={cn(
                  'text-base font-semibold tabular-nums',
                  SURVEY_STATUS_CONFIG[status].kpiColor
                )}
              >
                {statusCounts[status] ?? 0}
              </span>

              <span className="ml-1">
                {t(`surveys.dashboard.status.${status}` as Parameters<typeof t>[0])}
              </span>
            </span>
          </span>
        ))}

        {isProjectContext && targetResponses != null && targetResponses > 0 && (
          <span className="text-muted-foreground border-border bg-muted/50 ml-2 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs tabular-nums">
            <span className="text-foreground font-medium">{totalResponses ?? 0}</span>
            <span>/</span>
            <span>{targetResponses}</span>
            <span>{t('surveys.dashboard.responseUsageLabel')}</span>
          </span>
        )}
      </div>

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
  );
}
