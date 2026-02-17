// @vitest-environment node
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
const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
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

const USER = { id: 'user-123', email: 'test@example.com' };
const SURVEY_ID = '00000000-0000-4000-8000-000000000001';

const QUESTION_ID = '00000000-0000-4000-8000-000000000002';

const VALID_INPUT = {
  surveyId: SURVEY_ID,
  questions: [
    {
      id: QUESTION_ID,
      text: 'Question 1?',
      type: 'open_text' as const,
      required: false,
      description: null,
      config: {},
      sortOrder: 0,
    },
  ],
};

// ── Tests ────────────────────────────────────────────────────────────

describe('saveSurveyQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
    mockRpc.mockResolvedValue({ data: null, error: null });
    // Ownership check: from('surveys').select('id').eq(...).maybeSingle()
    mockFrom.mockReturnValue(chain({ data: { id: SURVEY_ID } }));
  });

  // RPC success → success; rpc called with p_survey_id, p_user_id, p_questions.
  it('returns success when rpc succeeds', async () => {
    const { saveSurveyQuestions } = await import('./save-survey-questions');
    const result = await saveSurveyQuestions(VALID_INPUT);

    expect(result).toEqual({ success: true });
    expect(mockRpc).toHaveBeenCalledWith(
      'save_survey_questions',
      expect.objectContaining({
        p_survey_id: SURVEY_ID,
        p_user_id: USER.id,
        p_questions: expect.arrayContaining([
          expect.objectContaining({
            id: QUESTION_ID,
            text: 'Question 1?',
            type: 'open_text',
            sortOrder: 0,
          }),
        ]),
      })
    );
  });

  // RPC error → error; no success.
  it('returns error when rpc returns error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Duplicate key' } });

    const { saveSurveyQuestions } = await import('./save-survey-questions');
    const result = await saveSurveyQuestions(VALID_INPUT);

    expect(result).toHaveProperty('error');
    expect(result).not.toHaveProperty('success');
  });

  // Invalid input (e.g. bad surveyId) → error; rpc not called.
  it('returns validation error for invalid input', async () => {
    const { saveSurveyQuestions } = await import('./save-survey-questions');
    const result = await saveSurveyQuestions({
      surveyId: 'not-a-uuid',
      questions: [],
    } as Parameters<typeof saveSurveyQuestions>[0]);

    expect(result).toHaveProperty('error');
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
