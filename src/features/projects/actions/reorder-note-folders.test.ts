// @vitest-environment node
/** Tests for reordering note folders via the reorderNoteFolders action. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Helpers ──────────────────────────────────────────────────────────

import { TEST_FOLDER_ID as FOLDER_ID, TEST_USER as USER, chain } from '@/test-utils/action-helpers';

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock('@/lib/common/env', () => ({
  env: {
    NODE_ENV: 'production',
    NEXT_PUBLIC_APP_URL: 'https://example.com',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  },
}));

vi.mock('@/lib/common/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ limited: false }),
}));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

const FOLDER_ID_2 = '00000000-0000-4000-8000-000000000031';
const FOLDER_ID_3 = '00000000-0000-4000-8000-000000000032';

// ── Tests ────────────────────────────────────────────────────────────

describe('Project Actions – Reorder Note Folders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should reorder all folders and return success', async () => {
    mockFrom.mockReturnValue(chain());

    const { reorderNoteFolders } = await import('./reorder-note-folders');
    const result = await reorderNoteFolders({
      folderIds: [FOLDER_ID, FOLDER_ID_2, FOLDER_ID_3],
    });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledTimes(3);
    expect(mockFrom).toHaveBeenCalledWith('project_note_folders');
  });

  it('should return error when one update fails', async () => {
    mockFrom.mockReturnValueOnce(chain({ error: { message: 'fail' } }));
    mockFrom.mockReturnValue(chain());

    const { reorderNoteFolders } = await import('./reorder-note-folders');
    const result = await reorderNoteFolders({
      folderIds: [FOLDER_ID, FOLDER_ID_2, FOLDER_ID_3],
    });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid folderIds', async () => {
    const { reorderNoteFolders } = await import('./reorder-note-folders');
    const result = await reorderNoteFolders({ folderIds: ['not-uuid'] });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
