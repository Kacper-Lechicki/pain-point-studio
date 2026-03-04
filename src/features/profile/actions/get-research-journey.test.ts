// @vitest-environment node
/** Tests for getResearchJourney — RPC-based read action. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_USER as USER } from '@/test-utils/action-helpers';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
  }),
}));

const mockGetUser = vi.fn();
const mockRpc = vi.fn();

const VALID_JOURNEY = {
  memberSince: '2024-06-01',
  firstProjectAt: '2024-07-15',
  firstSurveyAt: '2024-08-01',
  firstResponseAt: '2024-08-05',
  totalResponses: 42,
};

describe('Profile Actions – Get Research Journey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should return journey data on success', async () => {
    mockRpc.mockResolvedValue({ data: VALID_JOURNEY, error: null });

    const { getResearchJourney } = await import('./get-research-journey');
    const result = await getResearchJourney();

    expect(result).toEqual(VALID_JOURNEY);
    expect(mockRpc).toHaveBeenCalledWith('get_research_journey', { p_user_id: USER.id });
  });

  it('should return null when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getResearchJourney } = await import('./get-research-journey');
    const result = await getResearchJourney();

    expect(result).toBeNull();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return null on RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const { getResearchJourney } = await import('./get-research-journey');
    const result = await getResearchJourney();

    expect(result).toBeNull();
  });

  it('should return null when RPC returns malformed data', async () => {
    mockRpc.mockResolvedValue({ data: { wrong: 'shape' }, error: null });

    const { getResearchJourney } = await import('./get-research-journey');
    const result = await getResearchJourney();

    expect(result).toBeNull();
  });
});
