// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';

import { useSurveySelection } from './use-survey-selection';

const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/dashboard/surveys',
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams('selected=survey-1'),
}));

const mockGetSurveyWithQuestions = vi.fn();

vi.mock('@/features/surveys/actions', () => ({
  getSurveyWithQuestions: (id: string) => mockGetSurveyWithQuestions(id),
}));

// ── Helpers ──────────────────────────────────────────────────────────

const SURVEYS: UserSurvey[] = [
  {
    id: 'survey-1',
    title: 'Survey One',
    description: '',
    category: 'product',
    status: 'active',
    slug: 'survey-one',
    responseCount: 0,
    completedCount: 0,
    questionCount: 2,
    recentActivity: [],
    lastResponseAt: null,
    startsAt: null,
    endsAt: null,
    maxRespondents: null,
    archivedAt: null,
    cancelledAt: null,
    completedAt: null,
    createdAt: '',
    updatedAt: '',
    avgCompletionSeconds: null,
    avgQuestionCompletion: null,
  },
  {
    id: 'survey-2',
    title: 'Survey Two',
    description: '',
    category: 'product',
    status: 'draft',
    slug: null,
    responseCount: 0,
    completedCount: 0,
    questionCount: 0,
    recentActivity: [],
    lastResponseAt: null,
    startsAt: null,
    endsAt: null,
    maxRespondents: null,
    archivedAt: null,
    cancelledAt: null,
    completedAt: null,
    createdAt: '',
    updatedAt: '',
    avgCompletionSeconds: null,
    avgQuestionCompletion: null,
  },
];

// ── useSurveySelection ───────────────────────────────────────────────

describe('useSurveySelection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSurveyWithQuestions.mockResolvedValue({
      survey: {},
      questions: [
        {
          id: 'q1',
          text: 'Q1',
          type: 'open_text',
          required: false,
          description: null,
          config: {},
          sortOrder: 0,
        },
      ],
    });
  });

  // selectedId from searchParams; selectedSurvey from surveys list; showSheet true when both set.
  it('returns selectedId and selectedSurvey from searchParams and surveys list', () => {
    const { result } = renderHook(() => useSurveySelection(SURVEYS));

    expect(result.current.selectedId).toBe('survey-1');
    expect(result.current.selectedSurvey?.id).toBe('survey-1');
    expect(result.current.selectedSurvey?.title).toBe('Survey One');
    expect(result.current.showSheet).toBe(true);
  });

  // setSelected(id) calls router.replace with pathname?selected=id.
  it('calls router.replace with selected param when setSelected is called', () => {
    const { result } = renderHook(() => useSurveySelection(SURVEYS));

    act(() => {
      result.current.setSelected('survey-2');
    });

    expect(mockReplace).toHaveBeenCalledWith('/en/dashboard/surveys?selected=survey-2');
  });

  // setSelected(null) calls router.replace with pathname only.
  it('calls router.replace without query when setSelected(null) is called', () => {
    const { result } = renderHook(() => useSurveySelection(SURVEYS));

    act(() => {
      result.current.setSelected(null);
    });

    expect(mockReplace).toHaveBeenCalledWith('/en/dashboard/surveys');
  });
});
