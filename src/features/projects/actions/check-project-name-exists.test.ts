// @vitest-environment node
/** Tests for checkProjectNameExists — protected action. */
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

describe('Project Actions – Check Project Name Exists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should return exists: true when a matching project is found', async () => {
    mockFrom.mockReturnValue(chain({ data: { id: PROJECT_ID } }));

    const { checkProjectNameExists } = await import('./check-project-name-exists');
    const result = await checkProjectNameExists({ name: 'My Project' });

    expect(result).toEqual({ success: true, data: { exists: true } });
    expect(mockFrom).toHaveBeenCalledWith('projects');
  });

  it('should return exists: false when no matching project is found', async () => {
    mockFrom.mockReturnValue(chain({ data: null }));

    const { checkProjectNameExists } = await import('./check-project-name-exists');
    const result = await checkProjectNameExists({ name: 'Unique Name' });

    expect(result).toEqual({ success: true, data: { exists: false } });
    expect(mockFrom).toHaveBeenCalledWith('projects');
  });

  it('should support excludeProjectId parameter', async () => {
    mockFrom.mockReturnValue(chain({ data: null }));

    const { checkProjectNameExists } = await import('./check-project-name-exists');
    const result = await checkProjectNameExists({
      name: 'My Project',
      excludeProjectId: PROJECT_ID,
    });

    expect(result).toEqual({ success: true, data: { exists: false } });
  });

  it('should return validation error for empty name', async () => {
    const { checkProjectNameExists } = await import('./check-project-name-exists');
    const result = await checkProjectNameExists({ name: '' });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
