// @vitest-environment node
/** Tests for permanentDeleteProject — check status=trashed + delete. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Helpers ──────────────────────────────────────────────────────────

import {
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

describe('Project Actions – Permanent Delete Project', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should permanently delete trashed project and return success', async () => {
    mockFrom
      .mockReturnValueOnce(chain({ data: { status: 'trashed' } }))
      .mockReturnValueOnce(chain({ data: { id: PROJECT_ID } }));

    const { permanentDeleteProject } = await import('./permanent-delete-project');
    const result = await permanentDeleteProject({ projectId: PROJECT_ID });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith('projects');
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });

  it('should return error when project is not trashed', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: { status: 'active' } }));

    const { permanentDeleteProject } = await import('./permanent-delete-project');
    const result = await permanentDeleteProject({ projectId: PROJECT_ID });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('should return error when project not found', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null }));

    const { permanentDeleteProject } = await import('./permanent-delete-project');
    const result = await permanentDeleteProject({ projectId: PROJECT_ID });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('should return error when delete fails', async () => {
    mockFrom
      .mockReturnValueOnce(chain({ data: { status: 'trashed' } }))
      .mockReturnValueOnce(chain({ data: null, error: { message: 'fail' } }));

    const { permanentDeleteProject } = await import('./permanent-delete-project');
    const result = await permanentDeleteProject({ projectId: PROJECT_ID });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid projectId', async () => {
    const { permanentDeleteProject } = await import('./permanent-delete-project');
    const result = await permanentDeleteProject({ projectId: 'not-uuid' });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
