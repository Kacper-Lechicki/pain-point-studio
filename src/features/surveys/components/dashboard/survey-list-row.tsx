'use client';

import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { SurveyCardRow } from '@/features/surveys/components/dashboard/survey-card-row';
import { SurveyTableRow } from '@/features/surveys/components/dashboard/survey-table-row';
import { useSurveyRow } from '@/features/surveys/hooks/use-survey-row';

interface SurveyListRowProps {
  survey: UserSurvey;
  now: Date;
  isSelected: boolean;
  onSelect: (surveyId: string) => void;
  onStatusChange: (surveyId: string, action: string) => void;
  variant?: 'table' | 'card';
  archivedLayout?: boolean;
}

export function SurveyListRow({
  survey,
  now,
  isSelected,
  onSelect,
  onStatusChange,
  variant = 'table',
  archivedLayout = false,
}: SurveyListRowProps) {
  const row = useSurveyRow(survey, now, onStatusChange);

  if (variant === 'card') {
    return (
      <SurveyCardRow
        survey={survey}
        isSelected={isSelected}
        onSelect={onSelect}
        row={row}
        archivedLayout={archivedLayout}
      />
    );
  }

  return (
    <SurveyTableRow
      survey={survey}
      isSelected={isSelected}
      onSelect={onSelect}
      row={row}
      archivedLayout={archivedLayout}
    />
  );
}
