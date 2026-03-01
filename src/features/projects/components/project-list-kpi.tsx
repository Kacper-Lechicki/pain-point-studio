import { MousePointerClick } from 'lucide-react';
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
    <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="whitespace-nowrap">
          <span className="text-foreground text-base font-semibold tabular-nums">
            {Object.values(statusCounts).reduce((sum, n) => sum + n, 0)}
          </span>
          <span className="ml-1">{t('projects.list.summary.totalLabel')}</span>
        </span>
        {kpiStatuses.map((status) => (
          <span key={status} className="flex shrink-0 items-center gap-x-2">
            <span className="text-border text-xs" aria-hidden>
              /
            </span>
            <span className="whitespace-nowrap">
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
      <span
        className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-[11px] md:self-center"
        aria-hidden
      >
        <MousePointerClick className="size-3 shrink-0" />
        {t('projects.list.clickHint')}
      </span>
    </div>
  );
}
