'use client';

import { MousePointerClick } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { ProjectStatusFilter } from '@/features/projects/components/project-list-toolbar';
import { KPI_COLOR_ALL, PROJECT_STATUS_CONFIG } from '@/features/projects/config/status';
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

  const total = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 flex-wrap gap-2">
        <span
          className={cn(
            'border-border/60 bg-muted/40 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs tabular-nums',
            KPI_COLOR_ALL
          )}
        >
          <span className="font-semibold">{total}</span>
          <span className="text-muted-foreground">{t('projects.list.summary.totalLabel')}</span>
        </span>
        {kpiStatuses.map((status) => (
          <span
            key={status}
            className={cn(
              'border-border/60 bg-muted/40 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs tabular-nums',
              PROJECT_STATUS_CONFIG[status as keyof typeof PROJECT_STATUS_CONFIG]?.kpiColor
            )}
          >
            <span className="font-semibold">{statusCounts[status] ?? 0}</span>
            <span className="text-muted-foreground">
              {t(`projects.list.status.${status}` as MessageKey)}
            </span>
          </span>
        ))}
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]" aria-hidden>
          <MousePointerClick className="size-3 shrink-0" />
          {t('projects.list.clickHint')}
        </span>
      </div>
    </section>
  );
}
