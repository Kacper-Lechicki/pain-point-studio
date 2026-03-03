// @vitest-environment node
/** Tests for moving a note to a folder via the moveNoteToFolder action. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Helpers ──────────────────────────────────────────────────────────

import {
  TEST_FOLDER_ID as FOLDER_ID,
  TEST_NOTE_ID as NOTE_ID,
  TEST_USER as USER,
  chain,
} from '@/test-utils/action-helpers';

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

describe('Project Actions – Move Note to Folder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should move note to a folder and return success', async () => {
    mockFrom.mockReturnValue(chain({ data: { id: NOTE_ID } }));

    const { moveNoteToFolder } = await import('./move-note-to-folder');
    const result = await moveNoteToFolder({ noteId: NOTE_ID, folderId: FOLDER_ID });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith('project_notes');
  });

  it('should move note to unfiled (null folderId) and return success', async () => {
    mockFrom.mockReturnValue(chain({ data: { id: NOTE_ID } }));

    const { moveNoteToFolder } = await import('./move-note-to-folder');
    const result = await moveNoteToFolder({ noteId: NOTE_ID, folderId: null });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith('project_notes');
  });

  it('should return error when no matching row', async () => {
    mockFrom.mockReturnValue(chain({ data: null }));

    const { moveNoteToFolder } = await import('./move-note-to-folder');
    const result = await moveNoteToFolder({ noteId: NOTE_ID, folderId: FOLDER_ID });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid noteId', async () => {
    const { moveNoteToFolder } = await import('./move-note-to-folder');
    const result = await moveNoteToFolder({ noteId: 'not-a-uuid', folderId: FOLDER_ID });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
