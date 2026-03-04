// @vitest-environment node
/** Tests for deleting a note folder via the deleteNoteFolder action. */
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

// ── Tests ────────────────────────────────────────────────────────────

describe('Project Actions – Delete Note Folder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should delete folder and return success', async () => {
    mockFrom.mockReturnValue(chain());

    const { deleteNoteFolder } = await import('./delete-note-folder');
    const result = await deleteNoteFolder({ folderId: FOLDER_ID });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith('project_note_folders');
  });

  it('should return error when DB returns an error', async () => {
    mockFrom.mockReturnValue(chain({ error: { message: 'db error' } }));

    const { deleteNoteFolder } = await import('./delete-note-folder');
    const result = await deleteNoteFolder({ folderId: FOLDER_ID });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid folderId', async () => {
    const { deleteNoteFolder } = await import('./delete-note-folder');
    const result = await deleteNoteFolder({ folderId: 'not-a-uuid' });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
