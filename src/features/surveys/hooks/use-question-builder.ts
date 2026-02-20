import { useReducer } from 'react';

import { QUESTIONS_MAX, getDefaultConfig } from '@/features/surveys/config';
import type { QuestionSchema, QuestionType } from '@/features/surveys/types';

// ── State ───────────────────────────────────────────────────────────

export interface QuestionBuilderState {
  questions: QuestionSchema[];
  activeQuestionId: string | null;
  isDirty: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

// ── Actions ─────────────────────────────────────────────────────────

export type QuestionBuilderAction =
  | { type: 'ADD_QUESTION'; payload?: { questionType?: QuestionType } }
  | { type: 'DELETE_QUESTION'; payload: { questionId: string } }
  | { type: 'SELECT_QUESTION'; payload: { questionId: string } }
  | { type: 'UPDATE_QUESTION'; payload: { questionId: string; updates: Partial<QuestionSchema> } }
  | { type: 'CHANGE_QUESTION_TYPE'; payload: { questionId: string; newType: QuestionType } }
  | { type: 'REORDER_QUESTIONS'; payload: { questionIds: string[] } }
  | { type: 'SET_SAVE_STATUS'; payload: { status: QuestionBuilderState['saveStatus'] } }
  | { type: 'MARK_CLEAN' };

// ── Reducer ─────────────────────────────────────────────────────────

function questionBuilderReducer(
  state: QuestionBuilderState,
  action: QuestionBuilderAction
): QuestionBuilderState {
  switch (action.type) {
    case 'ADD_QUESTION': {
      if (state.questions.length >= QUESTIONS_MAX) {
        return state;
      }

      const type = action.payload?.questionType ?? 'open_text';

      const newQuestion: QuestionSchema = {
        id: crypto.randomUUID(),
        text: '',
        type,
        required: false,
        description: null,
        config: getDefaultConfig(type),
      };

      return {
        ...state,
        questions: [...state.questions, newQuestion],
        activeQuestionId: newQuestion.id,
        isDirty: true,
      };
    }

    case 'DELETE_QUESTION': {
      const index = state.questions.findIndex((q) => q.id === action.payload.questionId);

      if (index === -1) {
        return state;
      }

      const remaining = state.questions.filter((q) => q.id !== action.payload.questionId);

      let nextActiveId: string | null = null;

      if (remaining.length > 0) {
        nextActiveId =
          state.activeQuestionId === action.payload.questionId
            ? (remaining[Math.min(index, remaining.length - 1)]?.id ?? null)
            : state.activeQuestionId;
      }

      return {
        ...state,
        questions: remaining,
        activeQuestionId: nextActiveId,
        isDirty: true,
      };
    }

    case 'SELECT_QUESTION': {
      return { ...state, activeQuestionId: action.payload.questionId };
    }

    case 'UPDATE_QUESTION': {
      const { questionId, updates } = action.payload;

      return {
        ...state,
        questions: state.questions.map((q) => (q.id === questionId ? { ...q, ...updates } : q)),
        isDirty: true,
      };
    }

    case 'CHANGE_QUESTION_TYPE': {
      const { questionId, newType } = action.payload;

      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === questionId ? { ...q, type: newType, config: getDefaultConfig(newType) } : q
        ),
        isDirty: true,
      };
    }

    case 'REORDER_QUESTIONS': {
      const { questionIds } = action.payload;
      const byId = new Map(state.questions.map((q) => [q.id, q]));
      const reordered = questionIds.map((id) => byId.get(id)).filter(Boolean) as QuestionSchema[];

      if (reordered.length !== state.questions.length) {
        return state;
      }

      return { ...state, questions: reordered, isDirty: true };
    }

    case 'SET_SAVE_STATUS': {
      return { ...state, saveStatus: action.payload.status };
    }

    case 'MARK_CLEAN': {
      return { ...state, isDirty: false };
    }

    default:
      return state;
  }
}

// ── Hook ────────────────────────────────────────────────────────────

export function useQuestionBuilder(initialQuestions: QuestionSchema[] = []) {
  const initialState: QuestionBuilderState = {
    questions: initialQuestions,
    activeQuestionId: initialQuestions[0]?.id ?? null,
    isDirty: false,
    saveStatus: 'idle',
  };

  return useReducer(questionBuilderReducer, initialState);
}
