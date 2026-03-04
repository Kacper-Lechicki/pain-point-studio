// @vitest-environment node
/** Tests for getProjectSurveys — RPC-based read action. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_PROJECT_ID as PROJECT_ID, TEST_USER as USER } from '@/test-utils/action-helpers';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
  }),
}));

const mockGetUser = vi.fn();
const mockRpc = vi.fn();

const VALID_SURVEY = {
  id: 's1',
  title: 'Survey 1',
  description: 'Desc',
  status: 'active',
  slug: 'survey-1',
  viewCount: 10,
  responseCount: 5,
  completedCount: 3,
  questionCount: 10,
  recentActivity: [1, 2, 3],
  lastResponseAt: '2025-01-01',
  startsAt: null,
  endsAt: null,
  maxRespondents: null,
  archivedAt: null,
  cancelledAt: null,
  completedAt: null,
  createdAt: '2024-12-01',
  updatedAt: '2025-01-01',
  avgCompletionSeconds: 60,
  avgQuestionCompletion: 0.8,
  projectId: PROJECT_ID,
  projectName: 'Project 1',
};

describe('Survey Actions – Get Project Surveys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should return surveys on success', async () => {
    mockRpc.mockResolvedValue({ data: [VALID_SURVEY], error: null });

    const { getProjectSurveys } = await import('./get-project-surveys');
    const result = await getProjectSurveys(PROJECT_ID);

    expect(result).toHaveLength(1);
    expect(mockRpc).toHaveBeenCalledWith('get_project_surveys_with_counts', {
      p_user_id: USER.id,
      p_project_id: PROJECT_ID,
    });
  });

  it('should return null when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getProjectSurveys } = await import('./get-project-surveys');
    const result = await getProjectSurveys(PROJECT_ID);

    expect(result).toBeNull();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return null on RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const { getProjectSurveys } = await import('./get-project-surveys');
    const result = await getProjectSurveys(PROJECT_ID);

    expect(result).toBeNull();
  });

  it('should return empty array when RPC returns null data', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { getProjectSurveys } = await import('./get-project-surveys');
    const result = await getProjectSurveys(PROJECT_ID);

    expect(result).toEqual([]);
  });

  it('should return null when RPC returns malformed data', async () => {
    mockRpc.mockResolvedValue({ data: [{ bad: 'shape' }], error: null });

    const { getProjectSurveys } = await import('./get-project-surveys');
    const result = await getProjectSurveys(PROJECT_ID);

    expect(result).toBeNull();
  });
});
