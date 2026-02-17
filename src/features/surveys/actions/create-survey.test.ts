// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { z } from 'zod';

import { createSurveyDraftSchema } from '@/features/surveys/types';

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

const VALID_INPUT = {
  title: 'My Survey',
  description: 'A test survey',
  category: 'problem-validation',
  visibility: 'public' as const,
  action: 'saveDraft' as const,
};

const USER = { id: 'user-123', email: 'test@example.com' };

// ── Tests ────────────────────────────────────────────────────────────

describe('Survey Actions – Create Survey Draft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  // No surveyId; insert returns id → success and surveyId; insert called with user_id, title, status draft.
  it('should create a new survey draft when no surveyId is provided', async () => {
    const insertChain = chain({ data: { id: 'new-survey-id' } });
    mockFrom.mockReturnValue(insertChain);

    const { createSurveyDraft } = await import('./create-survey');
    const result = await createSurveyDraft(VALID_INPUT);

    expect(result).toEqual({ success: true, data: { surveyId: 'new-survey-id' } });
    expect(mockFrom).toHaveBeenCalledWith('surveys');
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER.id,
        title: VALID_INPUT.title,
        description: VALID_INPUT.description,
        category: VALID_INPUT.category,
        visibility: VALID_INPUT.visibility,
        status: 'draft',
      })
    );
  });

  // surveyId provided; update succeeds → success and same surveyId; update called with title, etc.
  it('should update an existing survey when surveyId is provided', async () => {
    const updateChain = chain({ data: null, error: null });
    mockFrom.mockReturnValue(updateChain);

    const surveyId = '00000000-0000-4000-8000-000000000001';

    const { createSurveyDraft } = await import('./create-survey');
    const result = await createSurveyDraft({ ...VALID_INPUT, surveyId });

    expect(result).toEqual({ success: true, data: { surveyId } });
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: VALID_INPUT.title,
        description: VALID_INPUT.description,
        category: VALID_INPUT.category,
        visibility: VALID_INPUT.visibility,
      })
    );
  });

  // Insert returns error → error; no success.
  it('should return error on insert failure', async () => {
    const insertChain = chain({ data: null, error: { message: 'Insert failed' } });
    mockFrom.mockReturnValue(insertChain);

    const { createSurveyDraft } = await import('./create-survey');
    const result = await createSurveyDraft(VALID_INPUT);

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });

  // Update returns error → error; no success.
  it('should return error on update failure', async () => {
    const updateChain = chain({ data: null, error: { message: 'Update failed' } });
    mockFrom.mockReturnValue(updateChain);

    const surveyId = '00000000-0000-4000-8000-000000000001';

    const { createSurveyDraft } = await import('./create-survey');
    const result = await createSurveyDraft({ ...VALID_INPUT, surveyId });

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });

  // Invalid data (e.g. empty title) → validation error; from() not called.
  it('should return validation error for invalid data', async () => {
    const { createSurveyDraft } = await import('./create-survey');
    const invalidPayload = { title: '' } as z.infer<typeof createSurveyDraftSchema>;
    const result = await createSurveyDraft(invalidPayload);

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
