import { useFormatter } from 'next-intl';

import { Separator } from '@/components/ui/separator';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { SurveyDetailInfo } from '@/features/surveys/components/dashboard/survey-detail-info';
import { DATE_FORMAT_SHORT } from '@/features/surveys/config';
import { deriveSurveyFlags } from '@/features/surveys/config/survey-status';

interface SurveyStatsDetailInfoProps {
  survey: UserSurvey;
}

export function SurveyStatsDetailInfo({ survey }: SurveyStatsDetailInfoProps) {
  const format = useFormatter();
  const flags = deriveSurveyFlags(survey.status);
  const { isDraft, isArchived } = flags;
  const showActiveDetails = !isDraft && !isArchived;
  const formatDate = (iso: string) => format.dateTime(new Date(iso), DATE_FORMAT_SHORT);

  return (
    <>
      <Separator />

      <SurveyDetailInfo
        survey={survey}
        flags={flags}
        showActiveDetails={showActiveDetails}
        formatDate={formatDate}
      />

      <Separator />
    </>
  );
}
