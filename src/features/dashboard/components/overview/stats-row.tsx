import { ClipboardList, FolderKanban, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { DashboardOverview } from '@/features/dashboard/actions/get-dashboard-overview';

export function StatsRow({ stats }: { stats: DashboardOverview['stats'] }) {
  const t = useTranslations();

  const items = [
    {
      label: t('dashboard.overview.stats.projects'),
      value: stats.totalProjects,
      icon: FolderKanban,
    },
    {
      label: t('dashboard.overview.stats.surveys'),
      value: stats.totalSurveys,
      icon: ClipboardList,
    },
    {
      label: t('dashboard.overview.stats.responses'),
      value: stats.totalResponses,
      icon: MessageSquare,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="border-border/50 flex flex-col gap-1 rounded-lg border p-3 sm:p-4"
        >
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <item.icon className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{item.label}</span>
          </div>

          <span className="text-foreground text-xl font-bold tabular-nums sm:text-2xl">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
