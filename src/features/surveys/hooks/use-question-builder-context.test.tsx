// @vitest-environment jsdom
/** QuestionBuilderProvider + useQuestionBuilderContext: context-driven question management. */
import type { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { QuestionSchema, QuestionType } from '@/features/surveys/types';

import { QuestionBuilderProvider, useQuestionBuilderContext } from './use-question-builder-context';

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock('@/features/surveys/config', () => ({
  QUESTIONS_MAX: 50,
  getDefaultConfig: (type: QuestionType) => ({ questionType: type }),
}));

// ── Helpers ──────────────────────────────────────────────────────────

const INITIAL_QUESTIONS: QuestionSchema[] = [
  {
    id: 'q-1',
    text: 'First question',
    type: 'open_text',
    required: true,
    description: null,
    config: {},
  },
  {
    id: 'q-2',
    text: 'Second question',
    type: 'multiple_choice',
    required: false,
    description: 'Optional description',
    config: { options: ['A', 'B'] },
  },
];

function createWrapper(initialQuestions: QuestionSchema[] = INITIAL_QUESTIONS) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QuestionBuilderProvider initialQuestions={initialQuestions}>
        {children}
      </QuestionBuilderProvider>
    );
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe('useQuestionBuilderContext', () => {
  it('should throw when used outside of QuestionBuilderProvider', () => {
    expect(() => {
      renderHook(() => useQuestionBuilderContext());
    }).toThrow('useQuestionBuilderContext must be used within a QuestionBuilderProvider');
  });

  it('should provide initial state via context', () => {
    const { result } = renderHook(() => useQuestionBuilderContext(), {
      wrapper: createWrapper(),
    });

    expect(result.current.state.questions).toHaveLength(2);
    expect(result.current.state.questions[0]?.text).toBe('First question');
    expect(result.current.state.questions[1]?.text).toBe('Second question');
  });

  it('should compute activeQuestion based on activeQuestionId', () => {
    const { result } = renderHook(() => useQuestionBuilderContext(), {
      wrapper: createWrapper(),
    });

    // Reducer auto-selects the first question on init
    expect(result.current.activeQuestion?.id).toBe('q-1');
    expect(result.current.activeQuestion?.text).toBe('First question');

    act(() => {
      result.current.selectQuestion('q-2');
    });

    expect(result.current.activeQuestion?.id).toBe('q-2');
    expect(result.current.activeQuestion?.text).toBe('Second question');
  });

  it('should add a question with default type', () => {
    const { result } = renderHook(() => useQuestionBuilderContext(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.addQuestion();
    });

    expect(result.current.state.questions).toHaveLength(3);
  });

  it('should add a question with a specific type', () => {
    const { result } = renderHook(() => useQuestionBuilderContext(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.addQuestion('rating_scale');
    });

    expect(result.current.state.questions).toHaveLength(3);
    expect(result.current.state.questions[2]?.type).toBe('rating_scale');
  });

  it('should delete a question by id', () => {
    const { result } = renderHook(() => useQuestionBuilderContext(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.deleteQuestion('q-1');
    });

    expect(result.current.state.questions).toHaveLength(1);
    expect(result.current.state.questions[0]?.id).toBe('q-2');
  });

  it('should select a question by id', () => {
    const { result } = renderHook(() => useQuestionBuilderContext(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.selectQuestion('q-2');
    });

    expect(result.current.state.activeQuestionId).toBe('q-2');
  });

  it('should update a question', () => {
    const { result } = renderHook(() => useQuestionBuilderContext(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.updateQuestion('q-1', { text: 'Updated text', required: false });
    });

    const updated = result.current.state.questions.find((q) => q.id === 'q-1');

    expect(updated?.text).toBe('Updated text');
    expect(updated?.required).toBe(false);
  });

  it('should change question type', () => {
    const { result } = renderHook(() => useQuestionBuilderContext(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.changeQuestionType('q-1', 'rating_scale');
    });

    expect(result.current.state.questions[0]?.type).toBe('rating_scale');
  });

  it('should reorder questions', () => {
    const { result } = renderHook(() => useQuestionBuilderContext(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.reorderQuestions(['q-2', 'q-1']);
    });

    expect(result.current.state.questions[0]?.id).toBe('q-2');
    expect(result.current.state.questions[1]?.id).toBe('q-1');
  });

  it('should build questions payload with correct sortOrder', () => {
    const { result } = renderHook(() => useQuestionBuilderContext(), {
      wrapper: createWrapper(),
    });

    const payload = result.current.buildQuestionsPayload();

    expect(payload).toHaveLength(2);

    expect(payload[0]).toEqual(
      expect.objectContaining({ id: 'q-1', text: 'First question', sortOrder: 0 })
    );

    expect(payload[1]).toEqual(
      expect.objectContaining({ id: 'q-2', text: 'Second question', sortOrder: 1 })
    );
  });

  it('should trim text and convert undefined description to null in payload', () => {
    const questions: QuestionSchema[] = [
      {
        id: 'q-1',
        text: '  Spaced text  ',
        type: 'open_text',
        required: false,
        description: undefined as unknown as string | null,
        config: {},
      },
    ];

    const { result } = renderHook(() => useQuestionBuilderContext(), {
      wrapper: createWrapper(questions),
    });

    const payload = result.current.buildQuestionsPayload();

    expect(payload[0]?.text).toBe('Spaced text');
    expect(payload[0]?.description).toBeNull();
  });
});
