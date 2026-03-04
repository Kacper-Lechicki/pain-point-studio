'use client';

import { useState } from 'react';

import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import type { SurveyAction } from '@/features/surveys/config/survey-status';
import { getAvailableActions } from '@/features/surveys/config/survey-status';
import type { SurveyStatus } from '@/features/surveys/types';

/** Bulk actions allowed in survey lists (exclude permanent delete for safety). */
export type BulkSurveyAction = Exclude<SurveyAction, 'permanentDelete'>;

export function useSurveyBulkSelection(surveys: UserSurvey[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function selectAll(filteredSurveys: UserSurvey[]) {
    setSelectedIds(new Set(filteredSurveys.map((s) => s.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  /** Actions available for ALL selected surveys (intersection). */
  const availableBulkActions: BulkSurveyAction[] = (() => {
    if (selectedIds.size === 0) {
      return [];
    }

    const selectedSurveys = surveys.filter((s) => selectedIds.has(s.id));

    if (selectedSurveys.length === 0) {
      return [];
    }

    const first = selectedSurveys[0];

    if (!first) {
      return [];
    }

    let commonActions: Set<SurveyAction> = new Set(
      getAvailableActions(first.status as SurveyStatus)
    );

    for (let i = 1; i < selectedSurveys.length; i++) {
      const survey = selectedSurveys[i];

      if (!survey) {
        continue;
      }

      const surveyActions = new Set(getAvailableActions(survey.status as SurveyStatus));
      commonActions = new Set([...commonActions].filter((a) => surveyActions.has(a)));
    }

    // Exclude permanent delete from bulk operations for safety
    commonActions.delete('permanentDelete');

    return [...commonActions] as BulkSurveyAction[];
  })();

  return {
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    availableBulkActions,
    selectionCount: selectedIds.size,
  };
}
