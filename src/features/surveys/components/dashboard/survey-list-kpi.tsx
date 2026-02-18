import { MousePointerClick } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
}

export function SurveyListKpi({
  statusCounts,
  kpiStatuses,
  hasActiveSurveys,
  isRefreshing,
  isRealtimeConnected,
  lastSyncedAt,
  onRefresh,
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
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-muted-foreground hidden items-center gap-1 text-[11px] md:flex">
          <MousePointerClick className="size-3" aria-hidden />
          {t('surveys.dashboard.clickHint')}
        </span>
        {hasActiveSurveys && (
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
