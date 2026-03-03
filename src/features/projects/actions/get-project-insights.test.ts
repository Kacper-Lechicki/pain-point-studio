// @vitest-environment node
/** Tests for getProjectInsights — query-based read action (returns array). */
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

const MOCK_INSIGHTS = [
  { id: 'i1', type: 'strength', content: 'Users love it', sort_order: 0 },
  { id: 'i2', type: 'threat', content: 'Competition growing', sort_order: 1 },
];

describe('Project Actions – Get Project Insights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should return insights on success', async () => {
    mockFrom.mockReturnValue(chain({ data: MOCK_INSIGHTS }));

    const { getProjectInsights } = await import('./get-project-insights');
    const result = await getProjectInsights(PROJECT_ID);

    expect(result).toEqual(MOCK_INSIGHTS);
    expect(mockFrom).toHaveBeenCalledWith('project_insights');
  });

  it('should return empty array when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getProjectInsights } = await import('./get-project-insights');
    const result = await getProjectInsights(PROJECT_ID);

    expect(result).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should return empty array on query error', async () => {
    mockFrom.mockReturnValue(chain({ error: { message: 'Query failed' } }));

    const { getProjectInsights } = await import('./get-project-insights');
    const result = await getProjectInsights(PROJECT_ID);

    expect(result).toEqual([]);
  });
});
