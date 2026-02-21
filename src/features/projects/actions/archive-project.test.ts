// @vitest-environment node
/** Tests for toggling project archive status via the archiveProject action. */
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

describe('Project Actions – Archive Project', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should archive an active project', async () => {
    const selectChain = chain({ data: { status: 'active' } });
    const updateChain = chain({ data: { id: PROJECT_ID } });

    let callCount = 0;

    mockFrom.mockImplementation(() => {
      callCount++;

      return callCount === 1 ? selectChain : updateChain;
    });

    const { archiveProject } = await import('./archive-project');
    const result = await archiveProject({ projectId: PROJECT_ID });

    expect(result).toEqual({ success: true });

    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'archived',
      })
    );

    const updateArg = (updateChain.update as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];

    expect(updateArg).toBeDefined();
    expect(updateArg!.archived_at).toBeTruthy();
  });

  it('should unarchive an archived project', async () => {
    const selectChain = chain({ data: { status: 'archived' } });
    const updateChain = chain({ data: { id: PROJECT_ID } });

    let callCount = 0;

    mockFrom.mockImplementation(() => {
      callCount++;

      return callCount === 1 ? selectChain : updateChain;
    });

    const { archiveProject } = await import('./archive-project');
    const result = await archiveProject({ projectId: PROJECT_ID });

    expect(result).toEqual({ success: true });

    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
        archived_at: null,
      })
    );
  });

  it('should return error when project not found', async () => {
    mockFrom.mockReturnValue(chain({ data: null }));

    const { archiveProject } = await import('./archive-project');
    const result = await archiveProject({ projectId: PROJECT_ID });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return error when update fails', async () => {
    const selectChain = chain({ data: { status: 'active' } });
    const updateChain = chain({ data: null, error: { message: 'Update failed' } });

    let callCount = 0;

    mockFrom.mockImplementation(() => {
      callCount++;

      return callCount === 1 ? selectChain : updateChain;
    });

    const { archiveProject } = await import('./archive-project');
    const result = await archiveProject({ projectId: PROJECT_ID });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid projectId', async () => {
    const { archiveProject } = await import('./archive-project');
    const result = await archiveProject({ projectId: 'not-a-uuid' });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
