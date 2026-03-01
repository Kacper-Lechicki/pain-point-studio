'use client';

import { useFormatter, useTranslations } from 'next-intl';

import type { OverviewProject } from '@/features/dashboard/actions/get-dashboard-overview';
import { getProjectDetailUrl } from '@/features/projects/lib/project-urls';
import Link from '@/i18n/link';

interface DashboardProjectCardProps {
  project: OverviewProject;
}

export function DashboardProjectCard({ project }: DashboardProjectCardProps) {
  const t = useTranslations();
  const format = useFormatter();
  const updatedAtLabel = format.relativeTime(new Date(project.updatedAt), new Date());

  return (
    <Link
      href={getProjectDetailUrl(project.id)}
      className="border-border/50 hover:border-border hover:bg-muted/30 flex min-w-0 flex-col rounded-lg border p-4 transition-colors"
    >
      {/* ── Zone 1: Identity ──────────────────────────────────────────── */}
      <div className="min-w-0">
        <span className="text-foreground block truncate text-sm font-semibold">{project.name}</span>

        {project.summary && (
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{project.summary}</p>
        )}
      </div>

      {/* ── Zone 2: Metrics ───────────────────────────────────────────── */}
      <div className="mt-4">
        <p className="text-muted-foreground text-xs">
          {t('dashboard.overview.projectCard.surveys', { count: project.surveyCount })}
          {' · '}
          {t('dashboard.overview.projectCard.responses', { count: project.responseCount })}
        </p>
      </div>

      {/* ── Zone 3: Footer ────────────────────────────────────────────── */}
      <div className="border-border/50 mt-4 flex items-center justify-between gap-2 border-t pt-3">
        <span className="text-muted-foreground text-xs">
          {t('dashboard.overview.projectCard.surveys', { count: project.surveyCount })}
        </span>

        <span className="text-muted-foreground shrink-0 text-xs">{updatedAtLabel}</span>
      </div>
    </Link>
  );
}
