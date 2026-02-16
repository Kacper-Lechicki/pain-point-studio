import { Archive, Calendar, CalendarClock, CalendarX2, Clock, Tag, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { ExpiryMetricRow } from '@/features/surveys/components/dashboard/expiry-metric-row';
import { SurveyStatusBadge } from '@/features/surveys/components/dashboard/survey-status-badge';
import { MetricRow, SectionLabel } from '@/features/surveys/components/shared/metric-display';
import { SURVEY_CATEGORIES } from '@/features/surveys/config/survey-categories';
import { SURVEY_STATUS_CONFIG } from '@/features/surveys/config/survey-status';
import type { SurveyStatusFlags } from '@/features/surveys/config/survey-status';

interface SurveyDetailInfoProps {
  survey: UserSurvey;
  flags: SurveyStatusFlags;
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
  const { isCompleted, isCancelled, isArchived } = flags;

  return (
    <>
      <SectionLabel>{t('surveys.dashboard.detailPanel.detailsLabel')}</SectionLabel>
      <div className="space-y-2">
        <MetricRow
          icon={SURVEY_STATUS_CONFIG[survey.status].icon}
          label={t('surveys.dashboard.detailPanel.status')}
          value={<SurveyStatusBadge status={survey.status} />}
        />
        {survey.category &&
          (() => {
            const cat = SURVEY_CATEGORIES.find((c) => c.value === survey.category);

            return cat ? (
              <MetricRow
                icon={Tag}
                label={t('surveys.dashboard.detailPanel.category')}
                value={t(cat.labelKey as Parameters<typeof t>[0])}
              />
            ) : null;
          })()}

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
        {isCancelled && (
          <ExpiryMetricRow
            timestampAt={survey.cancelledAt}
            labelKey="surveys.dashboard.detailPanel.linkExpires"
          />
        )}
        {isArchived && survey.archivedAt && (
          <MetricRow
            icon={Archive}
            label={t('surveys.dashboard.detailPanel.archivedAt')}
            value={formatDate(survey.archivedAt)}
          />
        )}
        {isArchived && (
          <ExpiryMetricRow
            timestampAt={survey.archivedAt}
            labelKey="surveys.dashboard.detailPanel.autoDeletes"
          />
        )}

        <MetricRow
          icon={Calendar}
          label={t('surveys.dashboard.detailPanel.created')}
          value={formatDate(survey.createdAt)}
        />
        <MetricRow
          icon={Clock}
          label={t('surveys.dashboard.detailPanel.updated')}
          value={formatDate(survey.updatedAt)}
        />
      </div>
    </>
  );
}
