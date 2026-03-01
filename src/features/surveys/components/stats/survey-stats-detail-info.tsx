import { ListChecks, MousePointerClick } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui/card';
import { MetricRow } from '@/components/ui/metric-display';
import { BENTO_CARD_CLASS } from '@/features/dashboard/components/bento/bento-styles';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { SurveyDetailInfo } from '@/features/surveys/components/dashboard/survey-detail-info';
import { DATE_FORMAT_SHORT } from '@/features/surveys/config';
import { deriveSurveyFlags } from '@/features/surveys/config/survey-status';
import { cn } from '@/lib/common/utils';

interface SurveyStatsDetailInfoProps {
  survey: UserSurvey;
  responseCount: number;
  avgQuestionCompletion: number | null;
}

export function SurveyStatsDetailInfo({
  survey,
  responseCount,
  avgQuestionCompletion,
}: SurveyStatsDetailInfoProps) {
  const t = useTranslations();
  const format = useFormatter();
  const flags = deriveSurveyFlags(survey.status);
  const { isDraft, isArchived } = flags;
  const showActiveDetails = !isDraft && !isArchived;
  const formatDate = (iso: string) => format.dateTime(new Date(iso), DATE_FORMAT_SHORT);

  return (
    <Card className={cn(BENTO_CARD_CLASS)}>
      <CardContent className="flex flex-col gap-1.5 p-3">
        <SurveyDetailInfo
          survey={survey}
          flags={flags}
          showActiveDetails={showActiveDetails}
          formatDate={formatDate}
        />

        <MetricRow
          icon={MousePointerClick}
          label={t('surveys.dashboard.detailPanel.started')}
          value={responseCount}
        />

        <MetricRow
          icon={ListChecks}
          label={t('surveys.dashboard.detailPanel.avgQuestionCompletion')}
          value={avgQuestionCompletion != null ? `${avgQuestionCompletion}%` : '—'}
        />
      </CardContent>
    </Card>
  );
}
