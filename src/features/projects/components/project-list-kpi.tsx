import { useTranslations } from 'next-intl';

import type { ProjectStatusFilter } from '@/features/projects/components/project-list-toolbar';
import { PROJECT_STATUS_CONFIG } from '@/features/projects/config/status';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

interface ProjectListKpiProps {
  statusCounts: Record<string, number>;
  kpiStatuses: ProjectStatusFilter[];
}

export function ProjectListKpi({ statusCounts, kpiStatuses }: ProjectListKpiProps) {
  const t = useTranslations();

  if (kpiStatuses.length === 0) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 text-xs">
        <span>
          <span className="text-foreground text-base font-semibold tabular-nums">
            {Object.values(statusCounts).reduce((sum, n) => sum + n, 0)}
          </span>

          <span className="ml-1">{t('projects.list.summary.totalLabel')}</span>
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
                  PROJECT_STATUS_CONFIG[status as keyof typeof PROJECT_STATUS_CONFIG]?.kpiColor
                )}
              >
                {statusCounts[status] ?? 0}
              </span>

              <span className="ml-1">{t(`projects.list.status.${status}` as MessageKey)}</span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
