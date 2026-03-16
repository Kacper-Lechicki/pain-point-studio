// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  TEST_PROJECT_ID as PROJECT_ID,
  TEST_USER as USER,
  chain,
} from '@/test-utils/action-helpers';

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

describe('Project Actions – Permanent Delete Project Force', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should permanently delete project when confirmation matches name', async () => {
    mockFrom
      .mockReturnValueOnce(chain({ data: { name: 'My Project' } }))
      .mockReturnValueOnce(chain({ data: { id: PROJECT_ID } }));

    const { permanentDeleteProjectForce } = await import('./permanent-delete-project-force');
    const result = await permanentDeleteProjectForce({
      projectId: PROJECT_ID,
      confirmation: 'My Project',
    });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });

  it('should return error when confirmation does not match name', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: { name: 'My Project' } }));

    const { permanentDeleteProjectForce } = await import('./permanent-delete-project-force');
    const result = await permanentDeleteProjectForce({
      projectId: PROJECT_ID,
      confirmation: 'Wrong Name',
    });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('should return error when project not found', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null }));

    const { permanentDeleteProjectForce } = await import('./permanent-delete-project-force');
    const result = await permanentDeleteProjectForce({
      projectId: PROJECT_ID,
      confirmation: 'My Project',
    });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('should return error when delete fails', async () => {
    mockFrom
      .mockReturnValueOnce(chain({ data: { name: 'My Project' } }))
      .mockReturnValueOnce(chain({ data: null, error: { message: 'fail' } }));

    const { permanentDeleteProjectForce } = await import('./permanent-delete-project-force');
    const result = await permanentDeleteProjectForce({
      projectId: PROJECT_ID,
      confirmation: 'My Project',
    });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid projectId', async () => {
    const { permanentDeleteProjectForce } = await import('./permanent-delete-project-force');
    const result = await permanentDeleteProjectForce({
      projectId: 'not-uuid',
      confirmation: 'My Project',
    });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should return validation error for empty confirmation', async () => {
    const { permanentDeleteProjectForce } = await import('./permanent-delete-project-force');
    const result = await permanentDeleteProjectForce({
      projectId: PROJECT_ID,
      confirmation: '',
    });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
