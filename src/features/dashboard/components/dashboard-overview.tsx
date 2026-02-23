'use client';

import { FolderKanban, Home, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ROUTES } from '@/config';
import type { DashboardOverview as DashboardOverviewData } from '@/features/dashboard/actions/get-dashboard-overview';
import { DASHBOARD_PAGE_BODY_GAP_TOP } from '@/features/dashboard/config/layout';
import Link from '@/i18n/link';

import { OverviewEmptyBlock } from './overview/overview-empty-block';
import { OverviewProjectCard } from './overview/overview-project-card';
import { OverviewSection } from './overview/overview-section';
import { OverviewSurveyRow } from './overview/overview-survey-row';
import { StatsRow } from './overview/stats-row';

// ── Props ────────────────────────────────────────────────────────────

interface DashboardOverviewProps {
  data: DashboardOverviewData;
}

// ── Main Component ───────────────────────────────────────────────────

export function DashboardOverview({ data }: DashboardOverviewProps) {
  const t = useTranslations();
  const hasProjects = data.recentProjects.length > 0;
  const hasSurveys = data.recentSurveys.length > 0;
  const isEmpty = !hasProjects && !hasSurveys;

  return (
    <div>
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Home className="size-7 shrink-0" aria-hidden />
          {t('dashboard.title')}
        </h1>

        <p className="text-muted-foreground mt-1 text-sm">{t('dashboard.overview.subtitle')}</p>
      </div>

      <div className={DASHBOARD_PAGE_BODY_GAP_TOP}>
        {isEmpty ? (
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
        ) : (
          <div className="flex flex-col gap-8">
            {/* Quick stats */}
            <StatsRow stats={data.stats} />

            {/* Recent projects */}
            <OverviewSection
              title={t('dashboard.overview.recentProjects.title')}
              viewAllLabel={t('dashboard.overview.recentProjects.viewAll')}
              viewAllHref={ROUTES.dashboard.projects}
              showViewAll={hasProjects}
            >
              {hasProjects ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.recentProjects.map((project) => (
                    <OverviewProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <OverviewEmptyBlock
                  message={t('dashboard.overview.recentProjects.empty')}
                  ctaLabel={t('dashboard.overview.empty.cta')}
                  ctaHref={ROUTES.dashboard.projectNew}
                />
              )}
            </OverviewSection>

            {/* Recent surveys */}
            <OverviewSection
              title={t('dashboard.overview.recentSurveys.title')}
              viewAllLabel={t('dashboard.overview.recentSurveys.viewAll')}
              viewAllHref={ROUTES.dashboard.research}
              showViewAll={hasSurveys}
            >
              {hasSurveys ? (
                <div className="flex flex-col gap-2">
                  {data.recentSurveys.map((survey) => (
                    <OverviewSurveyRow key={survey.id} survey={survey} />
                  ))}
                </div>
              ) : (
                <OverviewEmptyBlock
                  message={t('dashboard.overview.recentSurveys.empty')}
                  ctaLabel={t('surveys.createSurvey')}
                  ctaHref={ROUTES.dashboard.researchNew}
                />
              )}
            </OverviewSection>
          </div>
        )}
      </div>
    </div>
  );
}
