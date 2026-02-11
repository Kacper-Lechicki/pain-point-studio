import { useReducer } from 'react';

import { QUESTIONS_MAX } from '@/features/surveys/config';
import { getDefaultConfig } from '@/features/surveys/config/question-defaults';
import type { QuestionSchema, QuestionState, QuestionType } from '@/features/surveys/types';

// ── State ───────────────────────────────────────────────────────────

export interface QuestionBuilderState {
  questions: QuestionState[];
  activeQuestionId: string | null;
  isDirty: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  deletedQuestion: { question: QuestionState; index: number } | null;
}

// ── Actions ─────────────────────────────────────────────────────────

export type QuestionBuilderAction =
  | { type: 'ADD_QUESTION'; payload?: { questionType?: QuestionType } }
  | { type: 'DELETE_QUESTION'; payload: { questionId: string } }
  | { type: 'UNDO_DELETE' }
  | { type: 'CLEAR_DELETED' }
  | { type: 'SELECT_QUESTION'; payload: { questionId: string } }
  | { type: 'UPDATE_QUESTION'; payload: { questionId: string; updates: Partial<QuestionSchema> } }
  | { type: 'CHANGE_QUESTION_TYPE'; payload: { questionId: string; newType: QuestionType } }
  | { type: 'MOVE_QUESTION'; payload: { questionId: string; direction: 'up' | 'down' } }
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
      const newQuestion: QuestionState = {
        id: crypto.randomUUID(),
        text: '',
        type,
        required: true,
        description: null,
        config: getDefaultConfig(type),
        _isNew: true,
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

      const deleted = state.questions[index]!;
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
        deletedQuestion: { question: deleted, index },
      };
    }

    case 'UNDO_DELETE': {
      if (!state.deletedQuestion) {
        return state;
      }

      const { question, index } = state.deletedQuestion;
      const restored = [...state.questions];
      restored.splice(Math.min(index, restored.length), 0, question);

      return {
        ...state,
        questions: restored,
        activeQuestionId: question.id,
        isDirty: true,
        deletedQuestion: null,
      };
    }

    case 'CLEAR_DELETED': {
      return { ...state, deletedQuestion: null };
    }

    case 'SELECT_QUESTION': {
      return { ...state, activeQuestionId: action.payload.questionId };
    }

    case 'UPDATE_QUESTION': {
      const { questionId, updates } = action.payload;

      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === questionId ? { ...q, ...updates, _isNew: false } : q
        ),
        isDirty: true,
      };
    }

    case 'CHANGE_QUESTION_TYPE': {
      const { questionId, newType } = action.payload;

      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === questionId
            ? { ...q, type: newType, config: getDefaultConfig(newType), _isNew: false }
            : q
        ),
        isDirty: true,
      };
    }

    case 'MOVE_QUESTION': {
      const { questionId, direction } = action.payload;
      const idx = state.questions.findIndex((q) => q.id === questionId);

      if (idx === -1) {
        return state;
      }

      if (direction === 'up' && idx === 0) {
        return state;
      }

      if (direction === 'down' && idx === state.questions.length - 1) {
        return state;
      }

      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      const reordered = [...state.questions];
      const a = reordered[idx]!;
      const b = reordered[swapIdx]!;
      reordered[idx] = b;
      reordered[swapIdx] = a;

      return {
        ...state,
        questions: reordered,
        isDirty: true,
      };
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

export function useQuestionBuilder(initialQuestions: QuestionState[] = []) {
  const initialState: QuestionBuilderState = {
    questions: initialQuestions,
    activeQuestionId: initialQuestions[0]?.id ?? null,
    isDirty: false,
    saveStatus: 'idle',
    deletedQuestion: null,
  };

  return useReducer(questionBuilderReducer, initialState);
}
