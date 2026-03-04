// @vitest-environment node
/** Tests for getNoteFolders — query-based read action (returns array). */
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

const MOCK_FOLDERS = [
  { id: 'f1', name: 'Research', sort_order: 0 },
  { id: 'f2', name: 'Ideas', sort_order: 1 },
];

describe('Project Actions – Get Note Folders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should return folders on success', async () => {
    mockFrom.mockReturnValue(chain({ data: MOCK_FOLDERS }));

    const { getNoteFolders } = await import('./get-note-folders');
    const result = await getNoteFolders(PROJECT_ID);

    expect(result).toEqual(MOCK_FOLDERS);
    expect(mockFrom).toHaveBeenCalledWith('project_note_folders');
  });

  it('should return empty array when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getNoteFolders } = await import('./get-note-folders');
    const result = await getNoteFolders(PROJECT_ID);

    expect(result).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should return empty array on query error', async () => {
    mockFrom.mockReturnValue(chain({ error: { message: 'Query failed' } }));

    const { getNoteFolders } = await import('./get-note-folders');
    const result = await getNoteFolders(PROJECT_ID);

    expect(result).toEqual([]);
  });
});
