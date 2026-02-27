// @vitest-environment node
/** Tests for creating a new project via the createProject action. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { z } from 'zod';

import { createProjectSchema } from '@/features/projects/types';

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

const VALID_INPUT: z.infer<typeof createProjectSchema> = {
  name: 'My Project',
  summary: 'A test project',
};

const USER = { id: 'user-123', email: 'test@example.com' };

// ── Tests ────────────────────────────────────────────────────────────

describe('Project Actions – Create Project', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should create a new project and return its id', async () => {
    const insertChain = chain({ data: { id: 'new-project-id' } });

    mockFrom.mockReturnValue(insertChain);

    const { createProject } = await import('./create-project');
    const result = await createProject(VALID_INPUT);

    expect(result).toEqual({ success: true, data: { projectId: 'new-project-id' } });
    expect(mockFrom).toHaveBeenCalledWith('projects');

    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER.id,
        name: VALID_INPUT.name,
        summary: VALID_INPUT.summary,
      })
    );
  });

  it('should convert empty summary to null', async () => {
    const insertChain = chain({ data: { id: 'new-project-id' } });

    mockFrom.mockReturnValue(insertChain);

    const { createProject } = await import('./create-project');

    await createProject({ ...VALID_INPUT, summary: '' });

    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: null,
      })
    );
  });

  it('should return error on insert failure', async () => {
    const insertChain = chain({ data: null, error: { message: 'Insert failed' } });

    mockFrom.mockReturnValue(insertChain);

    const { createProject } = await import('./create-project');
    const result = await createProject(VALID_INPUT);

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });

  it('should return error when insert returns null data', async () => {
    const insertChain = chain({ data: null, error: null });

    mockFrom.mockReturnValue(insertChain);

    const { createProject } = await import('./create-project');
    const result = await createProject(VALID_INPUT);

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid data', async () => {
    const { createProject } = await import('./create-project');
    const invalidPayload = { name: '' } as z.infer<typeof createProjectSchema>;
    const result = await createProject(invalidPayload);

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
