'use client';

import { type ReactNode, createContext, useContext, useMemo } from 'react';

import type { QuestionSchema, QuestionType } from '@/features/surveys/types';

import {
  type QuestionBuilderAction,
  type QuestionBuilderState,
  useQuestionBuilder,
} from './use-question-builder';

interface QuestionBuilderContextValue {
  state: QuestionBuilderState;
  dispatch: React.Dispatch<QuestionBuilderAction>;
  activeQuestion: QuestionSchema | undefined;
  addQuestion: (type?: QuestionType) => void;
  deleteQuestion: (id: string) => void;
  selectQuestion: (id: string) => void;
  updateQuestion: (id: string, updates: Partial<QuestionSchema>) => void;
  changeQuestionType: (id: string, newType: QuestionType) => void;
  reorderQuestions: (questionIds: string[]) => void;
  buildQuestionsPayload: () => Array<{
    id: string;
    text: string;
    type: QuestionType;
    required: boolean;
    description: string | null;
    config: Record<string, unknown>;
    sortOrder: number;
  }>;
}

const QuestionBuilderContext = createContext<QuestionBuilderContextValue | null>(null);

interface QuestionBuilderProviderProps {
  initialQuestions: QuestionSchema[];
  children: ReactNode;
}

export function QuestionBuilderProvider({
  initialQuestions,
  children,
}: QuestionBuilderProviderProps) {
  const [state, dispatch] = useQuestionBuilder(initialQuestions);

  const contextValue = useMemo<QuestionBuilderContextValue>(
    () => ({
      state,
      dispatch,
      activeQuestion: state.questions.find((q) => q.id === state.activeQuestionId),
      addQuestion: (type?: QuestionType) => {
        dispatch(
          type
            ? { type: 'ADD_QUESTION', payload: { questionType: type } }
            : { type: 'ADD_QUESTION' }
        );
      },
      deleteQuestion: (id: string) => {
        dispatch({ type: 'DELETE_QUESTION', payload: { questionId: id } });
      },
      selectQuestion: (id: string) => {
        dispatch({ type: 'SELECT_QUESTION', payload: { questionId: id } });
      },
      updateQuestion: (id: string, updates: Partial<QuestionSchema>) => {
        dispatch({ type: 'UPDATE_QUESTION', payload: { questionId: id, updates } });
      },
      changeQuestionType: (id: string, newType: QuestionType) => {
        dispatch({ type: 'CHANGE_QUESTION_TYPE', payload: { questionId: id, newType } });
      },
      reorderQuestions: (questionIds: string[]) => {
        dispatch({ type: 'REORDER_QUESTIONS', payload: { questionIds } });
      },
      buildQuestionsPayload: () =>
        state.questions.map((q, i) => ({
          id: q.id,
          text: q.text?.trim() ?? '',
          type: q.type,
          required: q.required,
          description: q.description ?? null,
          config: q.config,
          sortOrder: i,
        })),
    }),
    [state, dispatch]
  );

  return (
    <QuestionBuilderContext.Provider value={contextValue}>
      {children}
    </QuestionBuilderContext.Provider>
  );
}

export function useQuestionBuilderContext() {
  const ctx = useContext(QuestionBuilderContext);

  if (!ctx) {
    throw new Error('useQuestionBuilderContext must be used within a QuestionBuilderProvider');
  }

  return ctx;
}
