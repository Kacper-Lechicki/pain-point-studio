// @vitest-environment node
/** Tests for updateProjectDescription — protected action. */
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

describe('Project Actions – Update Project Description', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should update description and return success', async () => {
    mockFrom.mockReturnValue(chain({ data: { id: PROJECT_ID } }));

    const { updateProjectDescription } = await import('./update-project-description');
    const result = await updateProjectDescription({
      projectId: PROJECT_ID,
      description: { type: 'doc', content: [] },
    });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith('projects');
  });

  it('should handle null description (clear)', async () => {
    mockFrom.mockReturnValue(chain({ data: { id: PROJECT_ID } }));

    const { updateProjectDescription } = await import('./update-project-description');
    const result = await updateProjectDescription({
      projectId: PROJECT_ID,
      description: null,
    });

    expect(result).toEqual({ success: true });
  });

  it('should return error when project not found', async () => {
    mockFrom.mockReturnValue(chain({ data: null }));

    const { updateProjectDescription } = await import('./update-project-description');
    const result = await updateProjectDescription({
      projectId: PROJECT_ID,
      description: { type: 'doc', content: [] },
    });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid projectId', async () => {
    const { updateProjectDescription } = await import('./update-project-description');
    const result = await updateProjectDescription({
      projectId: 'not-uuid',
      description: null,
    });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
