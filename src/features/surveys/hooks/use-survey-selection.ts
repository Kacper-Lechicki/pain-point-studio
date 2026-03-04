'use client';

import { getSurveyWithQuestions } from '@/features/surveys/actions';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import type { MappedQuestion } from '@/features/surveys/lib/map-question-row';
import { useItemSelection } from '@/hooks/common/use-item-selection';

export function useSurveySelection(surveys: UserSurvey[]) {
  async function fetchDetail(id: string) {
    const data = await getSurveyWithQuestions(id);

    return data?.questions ?? null;
  }

  const { selectedId, selectedItem, detailData, showSheet, setSelected } = useItemSelection<
    UserSurvey,
    MappedQuestion[]
  >({ items: surveys, fetchDetail });

  return {
    selectedId,
    selectedSurvey: selectedItem,
    questions: detailData,
    showSheet,
    setSelected,
  };
}
