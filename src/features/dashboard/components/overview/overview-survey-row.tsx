import { useFormatter, useTranslations } from 'next-intl';

import type { OverviewSurvey } from '@/features/dashboard/actions/get-dashboard-overview';
import { SurveyStatusBadge } from '@/features/surveys/components/dashboard/survey-status-badge';
import { getSurveyDetailUrl } from '@/features/surveys/lib/survey-urls';
import type { SurveyStatus } from '@/features/surveys/types';
import Link from '@/i18n/link';

export function OverviewSurveyRow({ survey }: { survey: OverviewSurvey }) {
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
