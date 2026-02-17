// @vitest-environment node
/** Tests for fetching a survey with its questions for the authenticated owner. */
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
  const obj: { data: unknown; error: unknown; [k: string]: unknown } = {
    data: result.data ?? null,
    error: result.error ?? null,
  };

  return new Proxy(obj, {
    get(target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return Promise.resolve(target)[prop as 'then'].bind(Promise.resolve(target));
      }

      const key = typeof prop === 'string' ? prop : String(prop);

      if (key in target) {
        return target[key];
      }

      target[key] = vi.fn().mockReturnValue(new Proxy(target, this as ProxyHandler<object>));

      return target[key];
    },
  });
}

const USER = { id: 'user-123', email: 'test@example.com' };
const SURVEY_ID = '00000000-0000-4000-8000-000000000001';

const SURVEY_ROW = {
  id: SURVEY_ID,
  title: 'My Survey',
  description: 'Desc',
  category: 'product',
  visibility: 'public',
  starts_at: null,
  ends_at: null,
  max_respondents: 10,
  status: 'draft',
};

const QUESTION_ROWS = [
  {
    id: 'q1',
    text: 'Q1?',
    type: 'open_text',
    required: true,
    description: null,
    config: {},
    sort_order: 0,
  },
  {
    id: 'q2',
    text: 'Q2?',
    type: 'rating_scale',
    required: false,
    description: null,
    config: { min: 1, max: 5 },
    sort_order: 1,
  },
];

// ── Tests ────────────────────────────────────────────────────────────

describe('getSurveyWithQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'surveys') {
        return chain({ data: SURVEY_ROW });
      }

      if (table === 'survey_questions') {
        return chain({ data: QUESTION_ROWS });
      }

      return chain();
    });
  });

  it('should return null when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getSurveyWithQuestions } = await import('./get-survey-with-questions');
    const result = await getSurveyWithQuestions(SURVEY_ID);

    expect(result).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should return null when survey not found for user', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'surveys') {
        return chain({ data: null });
      }

      return chain();
    });

    const { getSurveyWithQuestions } = await import('./get-survey-with-questions');
    const result = await getSurveyWithQuestions(SURVEY_ID);

    expect(result).toBeNull();
  });

  it('should return survey and questions with camelCase survey fields', async () => {
    const { getSurveyWithQuestions } = await import('./get-survey-with-questions');
    const result = await getSurveyWithQuestions(SURVEY_ID);

    expect(result).not.toBeNull();
    expect(result?.survey).toMatchObject({
      id: SURVEY_ID,
      title: 'My Survey',
      description: 'Desc',
      category: 'product',
      visibility: 'public',
      startsAt: null,
      endsAt: null,
      maxRespondents: 10,
      status: 'draft',
    });
  });

  it('should return questions mapped via mapQuestionRow', async () => {
    const { getSurveyWithQuestions } = await import('./get-survey-with-questions');
    const result = await getSurveyWithQuestions(SURVEY_ID);

    expect(result?.questions).toHaveLength(2);
    expect(result?.questions?.[0]).toMatchObject({
      id: 'q1',
      text: 'Q1?',
      type: 'open_text',
      required: true,
      sortOrder: 0,
    });
    expect(result?.questions?.[1]?.sortOrder).toBe(1);
  });

  it('should call from surveys with expected select and eq', async () => {
    const surveyChain = chain({ data: SURVEY_ROW });
    mockFrom.mockImplementation((table: string) =>
      table === 'surveys' ? surveyChain : chain({ data: QUESTION_ROWS })
    );

    const { getSurveyWithQuestions } = await import('./get-survey-with-questions');
    await getSurveyWithQuestions(SURVEY_ID);

    expect(mockFrom).toHaveBeenCalledWith('surveys');
    expect(mockFrom).toHaveBeenCalledWith('survey_questions');
    expect(surveyChain.select).toHaveBeenCalledWith(
      'id, title, description, category, visibility, starts_at, ends_at, max_respondents, status'
    );
    expect(surveyChain.eq).toHaveBeenCalledWith('id', SURVEY_ID);
    expect(surveyChain.eq).toHaveBeenCalledWith('user_id', USER.id);
  });
});
