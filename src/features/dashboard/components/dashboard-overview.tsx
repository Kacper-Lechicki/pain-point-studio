'use client';

import { ArrowRight, ClipboardList, FolderKanban, Home, MessageSquare, Plus } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ROUTES } from '@/config';
import type {
  DashboardOverview as DashboardOverviewData,
  OverviewProject,
  OverviewSurvey,
} from '@/features/dashboard/actions/get-dashboard-overview';
import { DASHBOARD_PAGE_BODY_GAP_TOP } from '@/features/dashboard/config/layout';
import { ValidationProgressDots } from '@/features/projects/components/validation-progress-dots';
import { PROJECT_CONTEXTS_CONFIG } from '@/features/projects/config/contexts';
import { getProjectDetailUrl } from '@/features/projects/lib/project-urls';
import type { ProjectContext } from '@/features/projects/types';
import { SurveyStatusBadge } from '@/features/surveys/components/dashboard/survey-status-badge';
import { getSurveyDetailUrl } from '@/features/surveys/lib/survey-urls';
import type { SurveyStatus } from '@/features/surveys/types';
import Link from '@/i18n/link';
import type { MessageKey } from '@/i18n/types';

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

// ── Stats Row ────────────────────────────────────────────────────────

function StatsRow({ stats }: { stats: DashboardOverviewData['stats'] }) {
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

// ── Section Wrapper ──────────────────────────────────────────────────

function OverviewSection({
  title,
  viewAllLabel,
  viewAllHref,
  showViewAll,
  children,
}: {
  title: string;
  viewAllLabel: string;
  viewAllHref: string;
  showViewAll: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>

        {showViewAll && (
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground -mr-2">
            <Link href={viewAllHref}>
              {viewAllLabel}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        )}
      </div>

      {children}
    </section>
  );
}

// ── Empty Block (inline) ─────────────────────────────────────────────

function OverviewEmptyBlock({
  message,
  ctaLabel,
  ctaHref,
}: {
  message: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="border-border/50 flex flex-col items-center gap-3 rounded-lg border border-dashed py-8 text-center">
      <p className="text-muted-foreground text-sm">{message}</p>

      <Button variant="outline" size="sm" asChild>
        <Link href={ctaHref}>
          <Plus className="size-3.5" aria-hidden />
          {ctaLabel}
        </Link>
      </Button>
    </div>
  );
}

// ── Project Card ─────────────────────────────────────────────────────

function OverviewProjectCard({ project }: { project: OverviewProject }) {
  const t = useTranslations();
  const format = useFormatter();
  const contextConfig = PROJECT_CONTEXTS_CONFIG[project.context as ProjectContext];
  const updatedAtLabel = format.relativeTime(new Date(project.updatedAt), new Date());

  return (
    <Link
      href={getProjectDetailUrl(project.id)}
      className="border-border/50 hover:border-border hover:bg-muted/30 flex min-w-0 flex-col gap-3 rounded-lg border p-3 transition-colors"
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <span className="text-foreground truncate text-sm font-semibold">{project.name}</span>
      </div>

      <p className="text-muted-foreground -mt-1 line-clamp-1 min-h-4 text-xs">
        {project.description || '\u00A0'}
      </p>

      <div className="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div className="flex flex-col gap-0.5">
          <span>{t(contextConfig.labelKey as MessageKey)}</span>

          <span className="text-foreground font-medium">
            {t('projects.list.card.surveys', { count: project.surveyCount })}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span>{t('projects.list.card.responses', { count: project.responseCount })}</span>

          {project.phaseStatuses ? (
            <ValidationProgressDots phaseStatuses={project.phaseStatuses} />
          ) : (
            <span className="text-foreground font-medium">—</span>
          )}
        </div>

        <div className="flex flex-col gap-0.5">
          <span>{t('projects.list.card.updated')}</span>
          <span className="text-foreground font-medium">{updatedAtLabel}</span>
        </div>
      </div>
    </Link>
  );
}

// ── Survey Row ───────────────────────────────────────────────────────

function OverviewSurveyRow({ survey }: { survey: OverviewSurvey }) {
  const t = useTranslations();
  const format = useFormatter();
  const updatedAtLabel = format.relativeTime(new Date(survey.updatedAt), new Date());

  return (
    <Link
      href={getSurveyDetailUrl(survey.id)}
      className="border-border/50 hover:border-border hover:bg-muted/30 flex min-w-0 items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="text-foreground min-w-0 truncate text-sm font-medium">{survey.title}</span>

        <SurveyStatusBadge status={survey.status as SurveyStatus} className="shrink-0" />
      </div>

      <div className="text-muted-foreground flex shrink-0 items-center gap-3 text-xs">
        {survey.projectName && (
          <span className="hidden truncate sm:inline">{survey.projectName}</span>
        )}

        <span className="tabular-nums">
          {t('dashboard.overview.recentSurveys.responses', { count: survey.responseCount })}
        </span>

        <span className="hidden sm:inline">{updatedAtLabel}</span>
      </div>
    </Link>
  );
}
