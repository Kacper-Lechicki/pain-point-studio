'use client';

import { type ReactNode, createContext, useCallback, useContext } from 'react';

import type { QuestionSchema, QuestionState, QuestionType } from '@/features/surveys/types';

import {
  type QuestionBuilderAction,
  type QuestionBuilderState,
  useQuestionBuilder,
} from './use-question-builder';

// ── Context value ───────────────────────────────────────────────────

interface QuestionBuilderContextValue {
  state: QuestionBuilderState;
  dispatch: React.Dispatch<QuestionBuilderAction>;
  activeQuestion: QuestionState | undefined;
  addQuestion: (type?: QuestionType) => void;
  deleteQuestion: (id: string) => void;
  selectQuestion: (id: string) => void;
  updateQuestion: (id: string, updates: Partial<QuestionSchema>) => void;
  changeQuestionType: (id: string, newType: QuestionType) => void;
  moveQuestion: (id: string, direction: 'up' | 'down') => void;
}

const QuestionBuilderContext = createContext<QuestionBuilderContextValue | null>(null);

// ── Provider ────────────────────────────────────────────────────────

interface QuestionBuilderProviderProps {
  initialQuestions: QuestionState[];
  children: ReactNode;
}

export function QuestionBuilderProvider({
  initialQuestions,
  children,
}: QuestionBuilderProviderProps) {
  const [state, dispatch] = useQuestionBuilder(initialQuestions);

  const activeQuestion = state.questions.find((q) => q.id === state.activeQuestionId);

  const addQuestion = useCallback(
    (type?: QuestionType) => {
      dispatch(
        type ? { type: 'ADD_QUESTION', payload: { questionType: type } } : { type: 'ADD_QUESTION' }
      );
    },
    [dispatch]
  );

  const deleteQuestion = useCallback(
    (id: string) => {
      dispatch({ type: 'DELETE_QUESTION', payload: { questionId: id } });
    },
    [dispatch]
  );

  const selectQuestion = useCallback(
    (id: string) => {
      dispatch({ type: 'SELECT_QUESTION', payload: { questionId: id } });
    },
    [dispatch]
  );

  const updateQuestion = useCallback(
    (id: string, updates: Partial<QuestionSchema>) => {
      dispatch({ type: 'UPDATE_QUESTION', payload: { questionId: id, updates } });
    },
    [dispatch]
  );

  const changeQuestionType = useCallback(
    (id: string, newType: QuestionType) => {
      dispatch({ type: 'CHANGE_QUESTION_TYPE', payload: { questionId: id, newType } });
    },
    [dispatch]
  );

  const moveQuestion = useCallback(
    (id: string, direction: 'up' | 'down') => {
      dispatch({ type: 'MOVE_QUESTION', payload: { questionId: id, direction } });
    },
    [dispatch]
  );

  return (
    <QuestionBuilderContext.Provider
      value={{
        state,
        dispatch,
        activeQuestion,
        addQuestion,
        deleteQuestion,
        selectQuestion,
        updateQuestion,
        changeQuestionType,
        moveQuestion,
      }}
    >
      {children}
    </QuestionBuilderContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────────

export function useQuestionBuilderContext() {
  const ctx = useContext(QuestionBuilderContext);

  if (!ctx) {
    throw new Error('useQuestionBuilderContext must be used within a QuestionBuilderProvider');
  }

  return ctx;
}
