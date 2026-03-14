// @vitest-environment jsdom
/** Tests for the useSurveySelection hook that syncs selected survey state with URL search params. */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserSurvey } from '@/features/surveys/types';

import { useSurveySelection } from './use-survey-selection';

const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/dashboard/research',
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
    status: 'active',
    slug: 'survey-one',
    viewCount: 0,
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
    projectId: 'project-1',
    projectName: 'Test Project',
    researchPhase: null,
    deletedAt: null,
    preTrashStatus: null,
    previousStatus: null,
  },
  {
    id: 'survey-2',
    title: 'Survey Two',
    description: '',
    status: 'draft',
    slug: null,
    viewCount: 0,
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
    projectId: 'project-1',
    projectName: 'Test Project',
    researchPhase: null,
    deletedAt: null,
    preTrashStatus: null,
    previousStatus: null,
  },
];

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

  it('should return selectedId and selectedSurvey from searchParams and surveys list', async () => {
    const { result } = renderHook(() => useSurveySelection(SURVEYS));

    await waitFor(() => {
      expect(result.current.selectedId).toBe('survey-1');
      expect(result.current.selectedSurvey?.id).toBe('survey-1');
      expect(result.current.selectedSurvey?.title).toBe('Survey One');
      expect(result.current.showSheet).toBe(true);
    });
  });

  it('should call router.replace with selected param when setSelected is called', () => {
    const { result } = renderHook(() => useSurveySelection(SURVEYS));

    act(() => {
      result.current.setSelected('survey-2');
    });

    expect(mockReplace).toHaveBeenCalledWith('/en/dashboard/research?selected=survey-2');
  });

  it('should call router.replace without query when setSelected(null) is called', () => {
    const { result } = renderHook(() => useSurveySelection(SURVEYS));

    act(() => {
      result.current.setSelected(null);
    });

    expect(mockReplace).toHaveBeenCalledWith('/en/dashboard/research');
  });
});
