// @vitest-environment node
/** Tests for createProjectNote — ownership check + insert. */
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

// ── Tests ────────────────────────────────────────────────────────────

describe('Project Actions – Create Project Note', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should create note and return noteId on success', async () => {
    mockFrom
      .mockReturnValueOnce(chain({ data: { id: PROJECT_ID } }))
      .mockReturnValueOnce(chain({ data: { id: NOTE_ID } }));

    const { createProjectNote } = await import('./create-project-note');
    const result = await createProjectNote({ projectId: PROJECT_ID });

    expect(result).toEqual({ success: true, data: { noteId: NOTE_ID } });
    expect(mockFrom).toHaveBeenCalledWith('projects');
    expect(mockFrom).toHaveBeenCalledWith('project_notes');
  });

  it('should return error when project is not owned by user', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null }));

    const { createProjectNote } = await import('./create-project-note');
    const result = await createProjectNote({ projectId: PROJECT_ID });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('should return error when insert fails', async () => {
    mockFrom
      .mockReturnValueOnce(chain({ data: { id: PROJECT_ID } }))
      .mockReturnValueOnce(chain({ data: null, error: { message: 'fail' } }));

    const { createProjectNote } = await import('./create-project-note');
    const result = await createProjectNote({ projectId: PROJECT_ID });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid projectId', async () => {
    const { createProjectNote } = await import('./create-project-note');
    const result = await createProjectNote({ projectId: 'not-uuid' });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
