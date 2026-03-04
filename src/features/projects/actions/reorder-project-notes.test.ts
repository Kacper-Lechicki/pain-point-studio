// @vitest-environment node
/** Tests for reordering project notes via the reorderProjectNotes action. */
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

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

const NOTE_ID_2 = '00000000-0000-4000-8000-000000000021';
const NOTE_ID_3 = '00000000-0000-4000-8000-000000000022';

// ── Tests ────────────────────────────────────────────────────────────

describe('Project Actions – Reorder Project Notes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should reorder all notes and return success', async () => {
    mockFrom.mockReturnValue(chain());

    const { reorderProjectNotes } = await import('./reorder-project-notes');
    const result = await reorderProjectNotes({
      noteIds: [NOTE_ID, NOTE_ID_2, NOTE_ID_3],
    });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledTimes(3);
    expect(mockFrom).toHaveBeenCalledWith('project_notes');
  });

  it('should return error when one update fails', async () => {
    mockFrom.mockReturnValueOnce(chain({ error: { message: 'fail' } }));
    mockFrom.mockReturnValue(chain());

    const { reorderProjectNotes } = await import('./reorder-project-notes');
    const result = await reorderProjectNotes({
      noteIds: [NOTE_ID, NOTE_ID_2, NOTE_ID_3],
    });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid noteIds', async () => {
    const { reorderProjectNotes } = await import('./reorder-project-notes');
    const result = await reorderProjectNotes({ noteIds: ['not-uuid'] });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
