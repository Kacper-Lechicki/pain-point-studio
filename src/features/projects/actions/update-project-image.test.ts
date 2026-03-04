// @vitest-environment node
/** Tests for updateProjectImage — protected action. */
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

describe('Project Actions – Update Project Image', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should update image URL and return success', async () => {
    mockFrom.mockReturnValue(chain({ data: { id: PROJECT_ID } }));

    const { updateProjectImage } = await import('./update-project-image');
    const result = await updateProjectImage({
      projectId: PROJECT_ID,
      imageUrl: 'https://example.com/image.png',
    });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith('projects');
  });

  it('should clear image with empty string and return success', async () => {
    mockFrom.mockReturnValue(chain({ data: { id: PROJECT_ID } }));

    const { updateProjectImage } = await import('./update-project-image');
    const result = await updateProjectImage({
      projectId: PROJECT_ID,
      imageUrl: '',
    });

    expect(result).toEqual({ success: true });
  });

  it('should return error when project not found', async () => {
    mockFrom.mockReturnValue(chain({ data: null }));

    const { updateProjectImage } = await import('./update-project-image');
    const result = await updateProjectImage({
      projectId: PROJECT_ID,
      imageUrl: 'https://example.com/image.png',
    });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid input', async () => {
    const { updateProjectImage } = await import('./update-project-image');
    const result = await updateProjectImage({
      projectId: 'not-uuid',
      imageUrl: 'not-url',
    });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
