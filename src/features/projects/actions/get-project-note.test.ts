// @vitest-environment node
/** Tests for getProjectNote — query-based read action. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_NOTE_ID as NOTE_ID, TEST_USER as USER, chain } from '@/test-utils/action-helpers';

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

const MOCK_NOTE = {
  id: NOTE_ID,
  title: 'Test note',
  content_json: { type: 'doc', content: [] },
};

describe('Project Actions – Get Project Note', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should return note on success', async () => {
    mockFrom.mockReturnValue(chain({ data: MOCK_NOTE }));

    const { getProjectNote } = await import('./get-project-note');
    const result = await getProjectNote(NOTE_ID);

    expect(result).toEqual(MOCK_NOTE);
    expect(mockFrom).toHaveBeenCalledWith('project_notes');
  });

  it('should return null when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getProjectNote } = await import('./get-project-note');
    const result = await getProjectNote(NOTE_ID);

    expect(result).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should return null on query error', async () => {
    mockFrom.mockReturnValue(chain({ error: { message: 'Query failed' } }));

    const { getProjectNote } = await import('./get-project-note');
    const result = await getProjectNote(NOTE_ID);

    expect(result).toBeNull();
  });

  it('should return null when note not found', async () => {
    mockFrom.mockReturnValue(chain({ data: null }));

    const { getProjectNote } = await import('./get-project-note');
    const result = await getProjectNote(NOTE_ID);

    expect(result).toBeNull();
  });
});
