// @vitest-environment node
/** Tests for updateProjectNote — updates content + auto-extracts title. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Helpers ──────────────────────────────────────────────────────────

import { TEST_NOTE_ID as NOTE_ID, TEST_USER as USER, chain } from '@/test-utils/action-helpers';

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

vi.mock('@/features/projects/lib/note-helpers', () => ({
  extractTitleFromTiptap: vi.fn().mockReturnValue('Extracted Title'),
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

describe('Project Actions – Update Project Note', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should update note content and return success', async () => {
    mockFrom.mockReturnValue(chain({ data: { id: NOTE_ID } }));

    const { updateProjectNote } = await import('./update-project-note');
    const result = await updateProjectNote({
      noteId: NOTE_ID,
      content: { type: 'doc', content: [] },
    });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith('project_notes');
  });

  it('should return error when note not found', async () => {
    mockFrom.mockReturnValue(chain({ data: null }));

    const { updateProjectNote } = await import('./update-project-note');
    const result = await updateProjectNote({
      noteId: NOTE_ID,
      content: { type: 'doc', content: [] },
    });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid noteId', async () => {
    const { updateProjectNote } = await import('./update-project-note');
    const result = await updateProjectNote({
      noteId: 'not-uuid',
      content: null,
    });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
