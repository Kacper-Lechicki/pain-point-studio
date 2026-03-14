'use client';

import { SurveyCardRow } from '@/features/surveys/components/dashboard/survey-card-row';
import { SurveyTableRow } from '@/features/surveys/components/dashboard/survey-table-row';
import { useSurveyRow } from '@/features/surveys/hooks/use-survey-row';
import type { UserSurvey } from '@/features/surveys/types';

interface SurveyListRowProps {
  survey: UserSurvey;
  now: Date;
  isSelected: boolean;
  onSelect: (surveyId: string) => void;
  onStatusChange: (surveyId: string, action: string) => void;
  variant?: 'table' | 'card';
  archivedLayout?: boolean;
  /** When true, hides project badge, simplifies actions, and adjusts columns. */
  isProjectContext?: boolean | undefined;
  /** Whether this row's checkbox is checked (for bulk selection). */
  isBulkSelected?: boolean | undefined;
  /** Toggle bulk selection for this survey's ID. */
  onToggleBulkSelect?: ((id: string) => void) | undefined;
}

export function SurveyListRow({
  survey,
  now,
  isSelected,
  onSelect,
  onStatusChange,
  variant = 'table',
  archivedLayout = false,
  isProjectContext,
  isBulkSelected,
  onToggleBulkSelect,
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
        isProjectContext={isProjectContext}
        isBulkSelected={isBulkSelected}
        onToggleBulkSelect={onToggleBulkSelect}
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
      isProjectContext={isProjectContext}
      isBulkSelected={isBulkSelected}
      onToggleBulkSelect={onToggleBulkSelect}
    />
  );
}
