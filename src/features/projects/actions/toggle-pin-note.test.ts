// @vitest-environment node
/** Tests for toggling note pin state via the togglePinProjectNote action. */
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

// ── Tests ────────────────────────────────────────────────────────────

describe('Project Actions – Toggle Pin Note', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should pin a note and return success', async () => {
    mockFrom.mockReturnValue(chain({ data: { id: NOTE_ID } }));

    const { togglePinProjectNote } = await import('./toggle-pin-note');
    const result = await togglePinProjectNote({ noteId: NOTE_ID, isPinned: true });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith('project_notes');
  });

  it('should unpin a note and return success', async () => {
    mockFrom.mockReturnValue(chain({ data: { id: NOTE_ID } }));

    const { togglePinProjectNote } = await import('./toggle-pin-note');
    const result = await togglePinProjectNote({ noteId: NOTE_ID, isPinned: false });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith('project_notes');
  });

  it('should return error when no matching row', async () => {
    mockFrom.mockReturnValue(chain({ data: null }));

    const { togglePinProjectNote } = await import('./toggle-pin-note');
    const result = await togglePinProjectNote({ noteId: NOTE_ID, isPinned: true });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid noteId', async () => {
    const { togglePinProjectNote } = await import('./toggle-pin-note');
    const result = await togglePinProjectNote({ noteId: 'not-a-uuid', isPinned: true });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
