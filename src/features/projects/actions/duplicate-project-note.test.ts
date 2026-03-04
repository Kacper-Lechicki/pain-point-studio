// @vitest-environment node
/** Tests for duplicateProjectNote — fetch original + insert copy. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Helpers ──────────────────────────────────────────────────────────

import {
  TEST_NOTE_ID as NOTE_ID,
  TEST_PROJECT_ID as PROJECT_ID,
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

const COPY_ID = '00000000-0000-4000-8000-000000000099';

const ORIGINAL_NOTE = {
  id: NOTE_ID,
  project_id: PROJECT_ID,
  user_id: USER.id,
  folder_id: null,
  title: 'My Note',
  content_json: { type: 'doc', content: [] },
  is_pinned: true,
};

// ── Tests ────────────────────────────────────────────────────────────

describe('Project Actions – Duplicate Project Note', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should duplicate note and return new noteId', async () => {
    const insertChain = chain({ data: { id: COPY_ID } });

    mockFrom.mockReturnValueOnce(chain({ data: ORIGINAL_NOTE })).mockReturnValueOnce(insertChain);

    const { duplicateProjectNote } = await import('./duplicate-project-note');
    const result = await duplicateProjectNote({ noteId: NOTE_ID });

    expect(result).toEqual({ success: true, data: { noteId: COPY_ID } });
    expect(mockFrom).toHaveBeenCalledWith('project_notes');

    expect(insertChain.insert).toHaveBeenCalledWith(expect.objectContaining({ is_pinned: false }));
  });

  it('should return error when original note not found', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null }));

    const { duplicateProjectNote } = await import('./duplicate-project-note');
    const result = await duplicateProjectNote({ noteId: NOTE_ID });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('should return error when insert fails', async () => {
    mockFrom
      .mockReturnValueOnce(chain({ data: ORIGINAL_NOTE }))
      .mockReturnValueOnce(chain({ data: null, error: { message: 'fail' } }));

    const { duplicateProjectNote } = await import('./duplicate-project-note');
    const result = await duplicateProjectNote({ noteId: NOTE_ID });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid noteId', async () => {
    const { duplicateProjectNote } = await import('./duplicate-project-note');
    const result = await duplicateProjectNote({ noteId: 'not-uuid' });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
