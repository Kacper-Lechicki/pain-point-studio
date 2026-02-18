'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { getSurveyWithQuestions } from '@/features/surveys/actions';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import type { MappedQuestion } from '@/features/surveys/lib/map-question-row';

export interface UseSurveySelectionReturn {
  selectedId: string | null;
  selectedSurvey: UserSurvey | null;
  questions: MappedQuestion[] | null;
  showSheet: boolean;
  setSelected: (id: string | null) => void;
}

export function useSurveySelection(surveys: UserSurvey[]): UseSurveySelectionReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedId = searchParams.get('selected');
  const [questions, setQuestions] = useState<MappedQuestion[] | null>(null);
  const fetchedForRef = useRef<string | null>(null);

  // Fetch question data when a survey is selected
  useEffect(() => {
    if (!selectedId || fetchedForRef.current === selectedId) {
      return;
    }

    fetchedForRef.current = selectedId;
    queueMicrotask(() => setQuestions(null));

    getSurveyWithQuestions(selectedId)
      .then((data) => {
        if (data && fetchedForRef.current === selectedId) {
          setQuestions(data.questions);
        }
      })
      .catch(() => {});
  }, [selectedId]);

  const selectedSurvey = useMemo(
    () => (selectedId ? (surveys.find((s) => s.id === selectedId) ?? null) : null),
    [surveys, selectedId]
  );

  const setSelected = useCallback(
    (id: string | null) => {
      if (id !== selectedId) {
        fetchedForRef.current = null;

        // Only reset questions when switching to another survey.
        // When deselecting (id=null), keep stale data so the closing
        // sheet animation doesn't flash a loading spinner.
        if (id) {
          setQuestions(null);
        }
      }

      const next = new URLSearchParams(searchParams.toString());

      if (id) {
        next.set('selected', id);
      } else {
        next.delete('selected');
      }

      const q = next.toString();

      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [selectedId, searchParams, router, pathname]
  );

  const showSheet = !!selectedId && !!selectedSurvey;

  return { selectedId, selectedSurvey, questions, showSheet, setSelected };
}
