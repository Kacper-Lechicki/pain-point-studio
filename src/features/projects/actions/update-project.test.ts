// @vitest-environment node
/** Tests for updating a project via the updateProject action. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

// ── Helpers ──────────────────────────────────────────────────────────

function chain(result: { data?: unknown; error?: unknown } = {}) {
  const obj: { data: unknown; error: unknown; [key: string]: unknown } = {
    data: result.data ?? null,
    error: result.error ?? null,
  };

  return new Proxy(obj, {
    get(target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return Promise.resolve(target)[prop as 'then'].bind(Promise.resolve(target));
      }

      const key = typeof prop === 'string' ? prop : undefined;

      if (key !== undefined && key in target) {
        return target[key];
      }

      if (key !== undefined) {
        target[key] = vi.fn().mockReturnValue(new Proxy(target, this));

        return target[key];
      }

      return undefined;
    },
  });
}

const PROJECT_ID = '00000000-0000-4000-8000-000000000001';
const USER = { id: 'user-123', email: 'test@example.com' };

// ── Tests ────────────────────────────────────────────────────────────

describe('Project Actions – Update Project', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should update project and return success', async () => {
    const updateChain = chain({ data: { id: PROJECT_ID } });

    mockFrom.mockReturnValue(updateChain);

    const { updateProject } = await import('./update-project');

    const result = await updateProject({
      projectId: PROJECT_ID,
      name: 'Updated Name',
      description: 'Updated desc',
    });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith('projects');

    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Updated Name',
        description: 'Updated desc',
      })
    );
  });

  it('should convert empty description to null', async () => {
    const updateChain = chain({ data: { id: PROJECT_ID } });

    mockFrom.mockReturnValue(updateChain);

    const { updateProject } = await import('./update-project');

    await updateProject({
      projectId: PROJECT_ID,
      name: 'Name',
      description: '',
    });

    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        description: null,
      })
    );
  });

  it('should return error when no matching row', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: null }));

    const { updateProject } = await import('./update-project');

    const result = await updateProject({
      projectId: PROJECT_ID,
      name: 'Name',
    });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid data', async () => {
    const { updateProject } = await import('./update-project');

    const result = await updateProject({
      projectId: 'not-a-uuid',
      name: '',
    });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
