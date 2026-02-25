// @vitest-environment node
/** Tests for creating a project insight via the createInsight action. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { z } from 'zod';

import { createInsightSchema } from '@/features/projects/types';

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
const INSIGHT_ID = '00000000-0000-4000-8000-000000000010';
const USER = { id: 'user-123', email: 'test@example.com' };

const VALID_INPUT: z.infer<typeof createInsightSchema> = {
  projectId: PROJECT_ID,
  phase: 'problem_discovery',
  type: 'strength',
  content: 'Most users confirmed the problem exists',
};

// ── Tests ────────────────────────────────────────────────────────────

describe('Project Actions – Create Insight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should create insight and return its id', async () => {
    const projectChain = chain({ data: { id: PROJECT_ID } });
    const insightChain = chain({ data: { id: INSIGHT_ID } });

    mockFrom.mockReturnValueOnce(projectChain).mockReturnValueOnce(insightChain);

    const { createInsight } = await import('./create-insight');
    const result = await createInsight(VALID_INPUT);

    expect(result).toEqual({ success: true, data: { insightId: INSIGHT_ID } });
    expect(mockFrom).toHaveBeenCalledWith('projects');
    expect(mockFrom).toHaveBeenCalledWith('project_insights');
  });

  it('should set phase to null when not provided', async () => {
    const projectChain = chain({ data: { id: PROJECT_ID } });
    const insightChain = chain({ data: { id: INSIGHT_ID } });

    mockFrom.mockReturnValueOnce(projectChain).mockReturnValueOnce(insightChain);

    const { createInsight } = await import('./create-insight');
    await createInsight({ ...VALID_INPUT, phase: undefined });

    expect(insightChain.insert).toHaveBeenCalledWith(expect.objectContaining({ phase: null }));
  });

  it('should return error when project not found (ownership fail)', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null }));

    const { createInsight } = await import('./create-insight');
    const result = await createInsight(VALID_INPUT);

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('should return error on insert failure', async () => {
    const projectChain = chain({ data: { id: PROJECT_ID } });
    const insightChain = chain({ data: null, error: { message: 'Insert failed' } });

    mockFrom.mockReturnValueOnce(projectChain).mockReturnValueOnce(insightChain);

    const { createInsight } = await import('./create-insight');
    const result = await createInsight(VALID_INPUT);

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return error when insert returns null data', async () => {
    const projectChain = chain({ data: { id: PROJECT_ID } });
    const insightChain = chain({ data: null, error: null });

    mockFrom.mockReturnValueOnce(projectChain).mockReturnValueOnce(insightChain);

    const { createInsight } = await import('./create-insight');
    const result = await createInsight(VALID_INPUT);

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should create insight with opportunity type', async () => {
    const projectChain = chain({ data: { id: PROJECT_ID } });
    const insightChain = chain({ data: { id: INSIGHT_ID } });

    mockFrom.mockReturnValueOnce(projectChain).mockReturnValueOnce(insightChain);

    const { createInsight } = await import('./create-insight');
    const result = await createInsight({ ...VALID_INPUT, type: 'opportunity' });

    expect(result).toEqual({ success: true, data: { insightId: INSIGHT_ID } });
    expect(insightChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'opportunity' })
    );
  });

  it('should return validation error for invalid data', async () => {
    const { createInsight } = await import('./create-insight');

    const result = await createInsight({ projectId: 'not-a-uuid' } as z.infer<
      typeof createInsightSchema
    >);

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
