// @vitest-environment node
/** Tests for createNoteFolder — ownership check + insert. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Helpers ──────────────────────────────────────────────────────────

import {
  TEST_FOLDER_ID as FOLDER_ID,
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

describe('Project Actions – Create Note Folder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should create folder and return folderId on success', async () => {
    mockFrom
      .mockReturnValueOnce(chain({ data: { id: PROJECT_ID } }))
      .mockReturnValueOnce(chain({ data: { id: FOLDER_ID } }));

    const { createNoteFolder } = await import('./create-note-folder');
    const result = await createNoteFolder({ projectId: PROJECT_ID, name: 'Research' });

    expect(result).toEqual({ success: true, data: { folderId: FOLDER_ID } });
    expect(mockFrom).toHaveBeenCalledWith('projects');
    expect(mockFrom).toHaveBeenCalledWith('project_note_folders');
  });

  it('should return error when project is not owned by user', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null }));

    const { createNoteFolder } = await import('./create-note-folder');
    const result = await createNoteFolder({ projectId: PROJECT_ID, name: 'Research' });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('should return error when insert fails', async () => {
    mockFrom
      .mockReturnValueOnce(chain({ data: { id: PROJECT_ID } }))
      .mockReturnValueOnce(chain({ data: null, error: { message: 'fail' } }));

    const { createNoteFolder } = await import('./create-note-folder');
    const result = await createNoteFolder({ projectId: PROJECT_ID, name: 'Research' });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for empty name', async () => {
    const { createNoteFolder } = await import('./create-note-folder');
    const result = await createNoteFolder({ projectId: PROJECT_ID, name: '' });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
