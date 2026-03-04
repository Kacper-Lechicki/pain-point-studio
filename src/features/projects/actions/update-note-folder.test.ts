// @vitest-environment node
/** Tests for renaming a note folder via the updateNoteFolder action. */
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

describe('Project Actions – Update Note Folder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should rename folder and return success', async () => {
    mockFrom.mockReturnValue(chain({ data: { id: FOLDER_ID } }));

    const { updateNoteFolder } = await import('./update-note-folder');
    const result = await updateNoteFolder({ folderId: FOLDER_ID, name: 'Renamed Folder' });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith('project_note_folders');
  });

  it('should return error when no matching row', async () => {
    mockFrom.mockReturnValue(chain({ data: null }));

    const { updateNoteFolder } = await import('./update-note-folder');
    const result = await updateNoteFolder({ folderId: FOLDER_ID, name: 'Renamed Folder' });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid input', async () => {
    const { updateNoteFolder } = await import('./update-note-folder');
    const result = await updateNoteFolder({ folderId: 'not-a-uuid', name: '' });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
