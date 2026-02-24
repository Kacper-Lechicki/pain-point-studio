'use client';

import { ClipboardList, FolderKanban, Home, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ROUTES } from '@/config';
import type { DashboardOverview as DashboardOverviewData } from '@/features/dashboard/actions/get-dashboard-overview';
import { DASHBOARD_PAGE_BODY_GAP_TOP } from '@/features/dashboard/config/layout';
import Link from '@/i18n/link';

import { DashboardProjectCard } from './overview/dashboard-project-card';

// ── Props ────────────────────────────────────────────────────────────

interface DashboardOverviewProps {
  data: DashboardOverviewData;
}

// ── Main Component ───────────────────────────────────────────────────

export function DashboardOverview({ data }: DashboardOverviewProps) {
  const t = useTranslations();
  const hasProjects = data.projects.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Home className="size-7 shrink-0" aria-hidden />
            {t('dashboard.title')}
          </h1>

          <p className="text-muted-foreground mt-1 text-sm">{t('dashboard.overview.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href={ROUTES.dashboard.researchNew}>
              <ClipboardList className="size-4" aria-hidden />
              {t('dashboard.overview.quickSurvey')}
            </Link>
          </Button>

          <Button asChild className="w-full sm:w-auto">
            <Link href={ROUTES.dashboard.projectNew}>
              <Plus className="size-4" aria-hidden />
              {t('dashboard.overview.newProject')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className={DASHBOARD_PAGE_BODY_GAP_TOP}>
        {hasProjects ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.projects.map((project) => (
              <DashboardProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FolderKanban}
            title={t('dashboard.overview.empty.title')}
            description={t('dashboard.overview.empty.description')}
            action={
              <Button asChild>
                <Link href={ROUTES.dashboard.projectNew}>
                  <Plus className="size-4" aria-hidden />
                  {t('dashboard.overview.empty.cta')}
                </Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
