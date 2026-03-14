// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  TEST_PROJECT_ID as PROJECT_ID,
  TEST_SURVEY_ID as SURVEY_ID,
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

const MOCK_SURVEYS = [
  {
    id: SURVEY_ID,
    title: 'Test Survey',
    status: 'completed',
    completed_at: '2025-01-15',
    cancelled_at: null,
  },
];

describe('Project Actions – Get Pending Insight Surveys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should return pending surveys with response counts', async () => {
    const surveysChain = chain({ data: MOCK_SURVEYS });
    const responsesChain = chain({
      data: [{ survey_id: SURVEY_ID }, { survey_id: SURVEY_ID }, { survey_id: SURVEY_ID }],
    });

    mockFrom.mockReturnValueOnce(surveysChain).mockReturnValueOnce(responsesChain);

    const { getPendingInsightSurveys } = await import('./get-pending-insight-surveys');
    const result = await getPendingInsightSurveys(PROJECT_ID);

    expect(result).toEqual([
      {
        id: SURVEY_ID,
        title: 'Test Survey',
        status: 'completed',
        completedAt: '2025-01-15',
        cancelledAt: null,
        totalResponses: 3,
      },
    ]);

    expect(mockFrom).toHaveBeenCalledWith('surveys');
    expect(mockFrom).toHaveBeenCalledWith('survey_responses');
  });

  it('should return empty array when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getPendingInsightSurveys } = await import('./get-pending-insight-surveys');
    const result = await getPendingInsightSurveys(PROJECT_ID);

    expect(result).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should return empty array on surveys query error', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null, error: { message: 'Query failed' } }));

    const { getPendingInsightSurveys } = await import('./get-pending-insight-surveys');
    const result = await getPendingInsightSurveys(PROJECT_ID);

    expect(result).toEqual([]);
  });

  it('should return empty array when no surveys match', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: [] }));

    const { getPendingInsightSurveys } = await import('./get-pending-insight-surveys');
    const result = await getPendingInsightSurveys(PROJECT_ID);

    expect(result).toEqual([]);
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('should handle null responses data gracefully', async () => {
    const surveysChain = chain({ data: MOCK_SURVEYS });
    const responsesChain = chain({ data: null });

    mockFrom.mockReturnValueOnce(surveysChain).mockReturnValueOnce(responsesChain);

    const { getPendingInsightSurveys } = await import('./get-pending-insight-surveys');
    const result = await getPendingInsightSurveys(PROJECT_ID);

    expect(result).toEqual([
      {
        id: SURVEY_ID,
        title: 'Test Survey',
        status: 'completed',
        completedAt: '2025-01-15',
        cancelledAt: null,
        totalResponses: 0,
      },
    ]);
  });
});
