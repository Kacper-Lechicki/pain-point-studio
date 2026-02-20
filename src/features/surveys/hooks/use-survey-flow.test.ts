// @vitest-environment jsdom
/** Tests for the useSurveyFlow hook managing question navigation, answers, and completion state. */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { PublicSurveyQuestion } from '@/features/surveys/types';

import { useSurveyFlow } from './use-survey-flow';

vi.mock('@/features/surveys/actions/respondent', () => ({
  saveAnswer: vi.fn().mockResolvedValue({ success: true }),
}));

// ── Helpers ──────────────────────────────────────────────────────────

function makeQuestion(overrides: Partial<PublicSurveyQuestion> = {}): PublicSurveyQuestion {
  return {
    id: 'q1',
    text: 'Question 1?',
    type: 'open_text',
    required: false,
    description: null,
    config: {},
    sortOrder: 0,
    ...overrides,
  };
}

const QUESTIONS: PublicSurveyQuestion[] = [
  makeQuestion({ id: 'q1' }),
  makeQuestion({ id: 'q2', text: 'Question 2?' }),
  makeQuestion({ id: 'q3', text: 'Question 3?' }),
];

// ── useSurveyFlow ────────────────────────────────────────────────────

describe('useSurveyFlow – initialization', () => {
  it('should start with currentIndex 0 and first question as currentQuestion', () => {
    const { result } = renderHook(() => useSurveyFlow({ questions: QUESTIONS, responseId: 'r1' }));

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.currentQuestion?.id).toBe('q1');
    expect(result.current.isComplete).toBe(false);
  });
});

describe('useSurveyFlow – updateAnswer', () => {
  it('should update currentAnswer when updateAnswer is called', () => {
    const { result } = renderHook(() => useSurveyFlow({ questions: QUESTIONS, responseId: 'r1' }));

    act(() => {
      result.current.updateAnswer({ text: 'My answer' });
    });

    expect(result.current.currentAnswer).toEqual({ text: 'My answer' });
  });
});

describe('useSurveyFlow – goToNext / goToPrevious', () => {
  it('should increment currentIndex when goToNext is called', () => {
    const { result } = renderHook(() => useSurveyFlow({ questions: QUESTIONS, responseId: 'r1' }));

    act(() => {
      result.current.goToNext();
    });

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.currentQuestion?.id).toBe('q2');
  });

  it('should set isComplete when goToNext on last question', () => {
    const { result } = renderHook(() => useSurveyFlow({ questions: QUESTIONS, responseId: 'r1' }));

    act(() => {
      result.current.goToNext();
    });

    act(() => {
      result.current.goToNext();
    });

    act(() => {
      result.current.goToNext();
    });

    expect(result.current.currentIndex).toBe(2);
    expect(result.current.isComplete).toBe(true);
  });

  it('should decrement currentIndex when goToPrevious is called', () => {
    const { result } = renderHook(() => useSurveyFlow({ questions: QUESTIONS, responseId: 'r1' }));

    act(() => {
      result.current.goToNext();
    });

    act(() => {
      result.current.goToPrevious();
    });

    expect(result.current.currentIndex).toBe(0);
  });
});

describe('useSurveyFlow – skip', () => {
  it('should move to next question without persisting', () => {
    const { result } = renderHook(() => useSurveyFlow({ questions: QUESTIONS, responseId: 'r1' }));

    act(() => {
      result.current.skip();
    });

    expect(result.current.currentIndex).toBe(1);
  });
});
