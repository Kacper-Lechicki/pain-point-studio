// @vitest-environment jsdom
/** Tests for the useQuestionBuilder reducer hook covering all dispatch actions. */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { QUESTIONS_MAX } from '@/features/surveys/config';
import type { QuestionSchema } from '@/features/surveys/types';

import { useQuestionBuilder } from './use-question-builder';

// ── Helpers ────────────────────────────────────────────────────────

function makeQuestion(overrides: Partial<QuestionSchema> = {}): QuestionSchema {
  return {
    id: crypto.randomUUID(),
    text: 'Sample question',
    type: 'open_text',
    required: false,
    description: null,
    config: {},
    ...overrides,
  };
}

// ── Initialization ─────────────────────────────────────────────────

describe('useQuestionBuilder – initialization', () => {
  it('should initialize with empty questions', () => {
    const { result } = renderHook(() => useQuestionBuilder());
    const [state] = result.current;

    expect(state.questions).toEqual([]);
    expect(state.activeQuestionId).toBeNull();
    expect(state.isDirty).toBe(false);
    expect(state.saveStatus).toBe('idle');
  });

  it('should initialize with provided questions and set first as active', () => {
    const q1 = makeQuestion();
    const q2 = makeQuestion();
    const { result } = renderHook(() => useQuestionBuilder([q1, q2]));
    const [state] = result.current;

    expect(state.questions).toHaveLength(2);
    expect(state.activeQuestionId).toBe(q1.id);
  });
});

// ── ADD_QUESTION ───────────────────────────────────────────────────

describe('useQuestionBuilder – ADD_QUESTION', () => {
  it('should add default open_text question', () => {
    const { result } = renderHook(() => useQuestionBuilder());

    act(() => {
      const [, dispatch] = result.current;
      dispatch({ type: 'ADD_QUESTION' });
    });

    const [state] = result.current;

    expect(state.questions).toHaveLength(1);
    expect(state.questions[0]?.type).toBe('open_text');
    expect(state.questions[0]?.text).toBe('');
    expect(state.questions[0]?.required).toBe(false);
    expect(state.questions[0]?.config).toEqual({});
    expect(state.activeQuestionId).toBe(state.questions[0]?.id);
    expect(state.isDirty).toBe(true);
  });

  it('should add question with specific type (multiple_choice)', () => {
    const { result } = renderHook(() => useQuestionBuilder());

    act(() => {
      const [, dispatch] = result.current;
      dispatch({ type: 'ADD_QUESTION', payload: { questionType: 'multiple_choice' } });
    });

    const [state] = result.current;

    expect(state.questions[0]?.type).toBe('multiple_choice');
    expect(state.questions[0]?.config).toEqual({ options: ['', ''], allowOther: false });
  });

  it('should do nothing at max capacity', () => {
    const questions = Array.from({ length: QUESTIONS_MAX }, () => makeQuestion());
    const { result } = renderHook(() => useQuestionBuilder(questions));

    act(() => {
      const [, dispatch] = result.current;
      dispatch({ type: 'ADD_QUESTION' });
    });

    const [state] = result.current;

    expect(state.questions).toHaveLength(QUESTIONS_MAX);
  });
});

// ── DELETE_QUESTION ────────────────────────────────────────────────

describe('useQuestionBuilder – DELETE_QUESTION', () => {
  it('should remove question', () => {
    const q1 = makeQuestion();
    const { result } = renderHook(() => useQuestionBuilder([q1]));

    act(() => {
      const [, dispatch] = result.current;
      dispatch({ type: 'DELETE_QUESTION', payload: { questionId: q1.id } });
    });

    const [state] = result.current;

    expect(state.questions).toHaveLength(0);
    expect(state.activeQuestionId).toBeNull();
    expect(state.isDirty).toBe(true);
  });

  it('should do nothing for non-existent ID', () => {
    const q1 = makeQuestion();
    const { result } = renderHook(() => useQuestionBuilder([q1]));

    act(() => {
      const [, dispatch] = result.current;
      dispatch({ type: 'DELETE_QUESTION', payload: { questionId: 'non-existent-id' } });
    });

    const [state] = result.current;

    expect(state.questions).toHaveLength(1);
    expect(state.isDirty).toBe(false);
  });

  it('should select next question when active deleted', () => {
    const q1 = makeQuestion();
    const q2 = makeQuestion();
    const q3 = makeQuestion();
    const { result } = renderHook(() => useQuestionBuilder([q1, q2, q3]));

    act(() => {
      const [, dispatch] = result.current;
      dispatch({ type: 'SELECT_QUESTION', payload: { questionId: q2.id } });
    });

    act(() => {
      const [, dispatch] = result.current;
      dispatch({ type: 'DELETE_QUESTION', payload: { questionId: q2.id } });
    });

    const [state] = result.current;

    expect(state.activeQuestionId).toBe(q3.id);
  });

  it('should select previous when last deleted', () => {
    const q1 = makeQuestion();
    const q2 = makeQuestion();
    const { result } = renderHook(() => useQuestionBuilder([q1, q2]));

    act(() => {
      const [, dispatch] = result.current;
      dispatch({ type: 'SELECT_QUESTION', payload: { questionId: q2.id } });
    });

    act(() => {
      const [, dispatch] = result.current;
      dispatch({ type: 'DELETE_QUESTION', payload: { questionId: q2.id } });
    });

    const [state] = result.current;

    expect(state.activeQuestionId).toBe(q1.id);
  });
});

// ── SELECT_QUESTION ────────────────────────────────────────────────

describe('useQuestionBuilder – SELECT_QUESTION', () => {
  it('should change active question', () => {
    const q1 = makeQuestion();
    const q2 = makeQuestion();
    const { result } = renderHook(() => useQuestionBuilder([q1, q2]));

    act(() => {
      const [, dispatch] = result.current;
      dispatch({ type: 'SELECT_QUESTION', payload: { questionId: q2.id } });
    });

    const [state] = result.current;

    expect(state.activeQuestionId).toBe(q2.id);
  });
});

// ── UPDATE_QUESTION ────────────────────────────────────────────────

describe('useQuestionBuilder – UPDATE_QUESTION', () => {
  it('should update fields and mark dirty', () => {
    const q1 = makeQuestion();
    const { result } = renderHook(() => useQuestionBuilder([q1]));

    act(() => {
      const [, dispatch] = result.current;
      dispatch({
        type: 'UPDATE_QUESTION',
        payload: { questionId: q1.id, updates: { text: 'Updated text', required: true } },
      });
    });

    const [state] = result.current;

    expect(state.questions[0]?.text).toBe('Updated text');
    expect(state.questions[0]?.required).toBe(true);
    expect(state.isDirty).toBe(true);
  });
});

// ── CHANGE_QUESTION_TYPE ───────────────────────────────────────────

describe('useQuestionBuilder – CHANGE_QUESTION_TYPE', () => {
  it('should change type and reset config', () => {
    const q1 = makeQuestion({ type: 'open_text', config: {} });
    const { result } = renderHook(() => useQuestionBuilder([q1]));

    act(() => {
      const [, dispatch] = result.current;
      dispatch({
        type: 'CHANGE_QUESTION_TYPE',
        payload: { questionId: q1.id, newType: 'rating_scale' },
      });
    });

    const [state] = result.current;

    expect(state.questions[0]?.type).toBe('rating_scale');
    expect(state.questions[0]?.config).toEqual({ min: 1, max: 5, minLabel: '', maxLabel: '' });
    expect(state.isDirty).toBe(true);
  });
});

// ── REORDER_QUESTIONS ──────────────────────────────────────────────

describe('useQuestionBuilder – REORDER_QUESTIONS', () => {
  it('should reorder correctly', () => {
    const q1 = makeQuestion();
    const q2 = makeQuestion();
    const q3 = makeQuestion();
    const { result } = renderHook(() => useQuestionBuilder([q1, q2, q3]));

    act(() => {
      const [, dispatch] = result.current;
      dispatch({
        type: 'REORDER_QUESTIONS',
        payload: { questionIds: [q3.id, q1.id, q2.id] },
      });
    });

    const [state] = result.current;

    expect(state.questions.map((q) => q.id)).toEqual([q3.id, q1.id, q2.id]);
    expect(state.isDirty).toBe(true);
  });

  it('should do nothing with mismatched IDs', () => {
    const q1 = makeQuestion();
    const q2 = makeQuestion();
    const { result } = renderHook(() => useQuestionBuilder([q1, q2]));

    act(() => {
      const [, dispatch] = result.current;
      dispatch({
        type: 'REORDER_QUESTIONS',
        payload: { questionIds: [q1.id, 'non-existent-id'] },
      });
    });

    const [state] = result.current;

    expect(state.questions.map((q) => q.id)).toEqual([q1.id, q2.id]);
    expect(state.isDirty).toBe(false);
  });
});

// ── SET_SAVE_STATUS ────────────────────────────────────────────────

describe('useQuestionBuilder – SET_SAVE_STATUS', () => {
  it('should update saveStatus', () => {
    const { result } = renderHook(() => useQuestionBuilder());

    act(() => {
      const [, dispatch] = result.current;
      dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'saving' } });
    });

    expect(result.current[0]?.saveStatus).toBe('saving');

    act(() => {
      const [, dispatch] = result.current;
      dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'saved' } });
    });

    expect(result.current[0]?.saveStatus).toBe('saved');
  });
});

// ── MARK_CLEAN ─────────────────────────────────────────────────────

describe('useQuestionBuilder – MARK_CLEAN', () => {
  it('should set isDirty to false', () => {
    const { result } = renderHook(() => useQuestionBuilder());

    act(() => {
      const [, dispatch] = result.current;
      dispatch({ type: 'ADD_QUESTION' });
    });

    expect(result.current[0]?.isDirty).toBe(true);

    act(() => {
      const [, dispatch] = result.current;
      dispatch({ type: 'MARK_CLEAN' });
    });

    expect(result.current[0]?.isDirty).toBe(false);
  });
});
