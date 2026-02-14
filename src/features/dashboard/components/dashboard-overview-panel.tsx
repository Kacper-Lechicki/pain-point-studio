'use client';

import { CircleDot, ClipboardList, Hash, Plus, TrendingUp } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ROUTES } from '@/config/routes';
import type { DashboardOverview } from '@/features/dashboard/actions/get-dashboard-overview';
import { SurveyStatusBadge } from '@/features/surveys/components/dashboard/survey-status-badge';
import { SectionLabel } from '@/features/surveys/components/shared/metric-display';
import { ResponseTimelineChart } from '@/features/surveys/components/shared/response-timeline-chart';
import type { SurveyStatus } from '@/features/surveys/types';
import Link from '@/i18n/link';

interface DashboardOverviewPanelProps {
  overview: DashboardOverview;
}

export const DashboardOverviewPanel = ({ overview }: DashboardOverviewPanelProps) => {
  const t = useTranslations('dashboard.overview');
  const format = useFormatter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-foreground text-3xl leading-tight font-bold">{t('welcomeBack')}</h1>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild size="sm" className="gap-1.5">
            <Link href={ROUTES.dashboard.surveysNew}>
              <Plus className="size-3.5" aria-hidden />
              {t('createSurvey')}
            </Link>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Metric cards */}
      <SectionLabel>{t('totalSurveys')}</SectionLabel>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricCard value={overview.totalSurveys} label={t('totalSurveys')} icon={ClipboardList} />
        <MetricCard
          value={overview.activeSurveys}
          label={t('activeSurveys')}
          icon={CircleDot}
          pulse={overview.activeSurveys > 0}
        />
        <MetricCard value={overview.totalResponses} label={t('totalResponses')} icon={Hash} />
        <MetricCard
          value={`${overview.avgCompletionRate}%`}
          label={t('avgCompletionRate')}
          icon={TrendingUp}
        />
      </div>

      {/* Response activity chart */}
      {overview.responseTimeline.length > 0 && overview.responseTimeline.some((v) => v > 0) && (
        <>
          <Separator />
          <SectionLabel>{t('responseActivity')}</SectionLabel>
          <ResponseTimelineChart data={overview.responseTimeline} />
        </>
      )}

      {/* Two-column: Top Surveys + Recent Responses */}
      <Separator />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Surveys */}
        <div className="space-y-3">
          <SectionLabel>{t('topSurveys')}</SectionLabel>
          {overview.topSurveys.length === 0 ? (
            <p className="text-muted-foreground text-xs">{t('noRecentResponses')}</p>
          ) : (
            <ul className="space-y-2" role="list">
              {overview.topSurveys.map((survey) => (
                <li key={survey.id}>
                  <Link
                    href={`${ROUTES.dashboard.surveysStats}/${survey.id}`}
                    className="bg-muted/30 hover:bg-muted/60 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground truncate text-sm font-medium">{survey.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <SurveyStatusBadge status={survey.status as SurveyStatus} />
                        <span className="text-muted-foreground text-[11px] tabular-nums">
                          {t('completedCount', { count: survey.completedCount })}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground w-full text-xs"
          >
            <Link href={ROUTES.dashboard.surveys}>{t('viewAll')}</Link>
          </Button>
        </div>

        {/* Recent Responses */}
        <div className="space-y-3">
          <SectionLabel>{t('recentResponses')}</SectionLabel>
          {overview.recentResponses.length === 0 ? (
            <p className="text-muted-foreground text-xs">{t('noRecentResponses')}</p>
          ) : (
            <ul className="space-y-2" role="list">
              {overview.recentResponses.map((response, i) => (
                <li
                  key={`${response.surveyId}-${response.completedAt}-${i}`}
                  className="bg-muted/30 rounded-lg px-3 py-2.5"
                >
                  <p className="text-foreground truncate text-sm font-medium">
                    {response.surveyTitle}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-muted-foreground text-[11px]">
                      {format.relativeTime(new Date(response.completedAt))}
                    </span>
                    {response.feedback && (
                      <>
                        <span className="text-border/60 text-[11px]" aria-hidden>
                          ·
                        </span>
                        <span className="text-muted-foreground truncate text-[11px]">
                          {response.feedback}
                        </span>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- Internal metric card ---------- */

function MetricCard({
  value,
  label,
  icon: Icon,
  pulse,
}: {
  value: string | number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pulse?: boolean;
}) {
  return (
    <div className="border-border/50 rounded-md border px-3 py-2.5">
      <div className="text-foreground flex items-center gap-1.5 text-lg leading-none font-semibold tabular-nums">
        {value}
        {pulse && (
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
        )}
      </div>
      <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-[11px]">
        <Icon className="size-3" aria-hidden />
        {label}
      </div>
    </div>
  );
}
