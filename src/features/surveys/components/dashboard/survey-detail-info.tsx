'use client';

import { CalendarClock, CalendarX2, FolderKanban, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { SurveyStatusBadge } from '@/components/shared/survey-status-badge';
import { MetricRow, SectionLabel } from '@/components/ui/metric-display';
import { ExpiryMetricRow } from '@/features/surveys/components/dashboard/expiry-metric-row';
import { SURVEY_STATUS_CONFIG } from '@/features/surveys/config/survey-status';
import type { UserSurvey } from '@/features/surveys/types';
import Link from '@/i18n/link';
import { getProjectDetailUrl } from '@/lib/common/urls/project-urls';

interface SurveyDetailInfoProps {
  survey: UserSurvey;
  flags: { isCompleted: boolean };
  showActiveDetails: boolean;
  formatDate: (iso: string) => string;
}

export function SurveyDetailInfo({
  survey,
  flags,
  showActiveDetails,
  formatDate,
}: SurveyDetailInfoProps) {
  const t = useTranslations();
  const { isCompleted } = flags;

  return (
    <div>
      <SectionLabel>{t('surveys.dashboard.detailPanel.detailsLabel')}</SectionLabel>

      <div className="space-y-2">
        <MetricRow
          icon={SURVEY_STATUS_CONFIG[survey.status].icon}
          label={t('surveys.dashboard.detailPanel.status')}
          value={<SurveyStatusBadge status={survey.status} deletedAt={survey.deletedAt} />}
        />

        {survey.projectName && survey.projectId && (
          <MetricRow
            icon={FolderKanban}
            label={t('surveys.dashboard.detailPanel.project')}
            value={
              <Link
                href={getProjectDetailUrl(survey.projectId)}
                className="text-foreground underline underline-offset-2"
              >
                {survey.projectName}
              </Link>
            }
          />
        )}

        {showActiveDetails && survey.startsAt && (
          <MetricRow
            icon={CalendarClock}
            label={t('surveys.dashboard.detailPanel.startsAt')}
            value={formatDate(survey.startsAt)}
          />
        )}

        {showActiveDetails && survey.endsAt && (
          <MetricRow
            icon={CalendarX2}
            label={t('surveys.dashboard.detailPanel.endsAt')}
            value={formatDate(survey.endsAt)}
          />
        )}

        {showActiveDetails && survey.maxRespondents != null && (
          <MetricRow
            icon={Users}
            label={t('surveys.dashboard.detailPanel.respondentCap')}
            value={survey.maxRespondents}
          />
        )}

        {isCompleted && (
          <ExpiryMetricRow
            timestampAt={survey.completedAt}
            labelKey="surveys.dashboard.detailPanel.linkExpires"
          />
        )}
      </div>
    </div>
  );
}
