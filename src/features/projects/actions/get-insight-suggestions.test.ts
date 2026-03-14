// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  TEST_PROJECT_ID as PROJECT_ID,
  TEST_USER as USER,
  chain,
} from '@/test-utils/action-helpers';

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

const mockGetProjectSignalsData = vi.fn();

vi.mock('@/features/projects/actions/get-project-signals-data', () => ({
  getProjectSignalsData: mockGetProjectSignalsData,
}));

const mockGenerateInsightSuggestions = vi.fn();

vi.mock('@/features/projects/lib/suggestions', () => ({
  generateInsightSuggestions: mockGenerateInsightSuggestions,
}));

const MOCK_SIGNALS = [
  { surveyId: 's1', completedResponses: 10, questions: [] },
  { surveyId: 's2', completedResponses: 5, questions: [] },
];

const MOCK_SUGGESTIONS = [
  {
    signature: 's1:q1:yes_no',
    content: 'Users confirmed the problem',
    source: { surveyTitle: 'Survey 1' },
  },
];

describe('Project Actions – Get Insight Suggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should return suggestions and total completed responses', async () => {
    mockGetProjectSignalsData.mockResolvedValue(MOCK_SIGNALS);
    mockFrom.mockReturnValueOnce(chain({ data: [{ signature: 'old-sig' }] }));
    mockGenerateInsightSuggestions.mockReturnValue(MOCK_SUGGESTIONS);

    const { getInsightSuggestions } = await import('./get-insight-suggestions');
    const result = await getInsightSuggestions(PROJECT_ID);

    expect(result).toEqual({
      suggestions: MOCK_SUGGESTIONS,
      totalCompletedResponses: 15,
    });

    expect(mockGetProjectSignalsData).toHaveBeenCalledWith(PROJECT_ID);
    expect(mockGenerateInsightSuggestions).toHaveBeenCalledWith(MOCK_SIGNALS, new Set(['old-sig']));
  });

  it('should return empty result when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getInsightSuggestions } = await import('./get-insight-suggestions');
    const result = await getInsightSuggestions(PROJECT_ID);

    expect(result).toEqual({ suggestions: [], totalCompletedResponses: 0 });
    expect(mockGetProjectSignalsData).not.toHaveBeenCalled();
  });

  it('should handle empty signals data', async () => {
    mockGetProjectSignalsData.mockResolvedValue([]);
    mockFrom.mockReturnValueOnce(chain({ data: [] }));
    mockGenerateInsightSuggestions.mockReturnValue([]);

    const { getInsightSuggestions } = await import('./get-insight-suggestions');
    const result = await getInsightSuggestions(PROJECT_ID);

    expect(result).toEqual({ suggestions: [], totalCompletedResponses: 0 });
  });

  it('should handle null actions data gracefully', async () => {
    mockGetProjectSignalsData.mockResolvedValue(MOCK_SIGNALS);
    mockFrom.mockReturnValueOnce(chain({ data: null }));
    mockGenerateInsightSuggestions.mockReturnValue(MOCK_SUGGESTIONS);

    const { getInsightSuggestions } = await import('./get-insight-suggestions');
    const result = await getInsightSuggestions(PROJECT_ID);

    expect(result).toEqual({
      suggestions: MOCK_SUGGESTIONS,
      totalCompletedResponses: 15,
    });

    expect(mockGenerateInsightSuggestions).toHaveBeenCalledWith(MOCK_SIGNALS, new Set());
  });
});
