// @vitest-environment node
/** Tests for getProjectNotes — query-based read action (returns array). */
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

const MOCK_NOTES = [
  { id: 'n1', title: 'Note 1', sort_order: 0 },
  { id: 'n2', title: 'Note 2', sort_order: 1 },
];

describe('Project Actions – Get Project Notes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should return notes on success', async () => {
    mockFrom.mockReturnValue(chain({ data: MOCK_NOTES }));

    const { getProjectNotes } = await import('./get-project-notes');
    const result = await getProjectNotes(PROJECT_ID);

    expect(result).toEqual(MOCK_NOTES);
    expect(mockFrom).toHaveBeenCalledWith('project_notes');
  });

  it('should return empty array when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getProjectNotes } = await import('./get-project-notes');
    const result = await getProjectNotes(PROJECT_ID);

    expect(result).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should return empty array on query error', async () => {
    mockFrom.mockReturnValue(chain({ error: { message: 'Query failed' } }));

    const { getProjectNotes } = await import('./get-project-notes');
    const result = await getProjectNotes(PROJECT_ID);

    expect(result).toEqual([]);
  });
});
