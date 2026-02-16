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

const SURVEY_ID = '00000000-0000-4000-8000-000000000001';
const NEW_SURVEY_ID = '00000000-0000-4000-8000-000000000002';
const USER = { id: 'user-123', email: 'test@example.com' };

const ORIGINAL_SURVEY = {
  title: 'My Survey',
  description: 'Description',
  category: 'product',
  visibility: 'public',
  max_respondents: 100,
};

const QUESTIONS = [
  {
    text: 'Q1?',
    type: 'open_text',
    required: true,
    description: null,
    config: {},
    sort_order: 0,
  },
  {
    text: 'Q2?',
    type: 'rating_scale',
    required: false,
    description: 'Rate it',
    config: { min: 1, max: 5 },
    sort_order: 1,
  },
];

// ── Tests ────────────────────────────────────────────────────────────

describe('Survey Actions – Duplicate Survey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  // Fetch original + insert survey + copy questions succeed → success and new surveyId; title has " (copy)".
  it('should duplicate survey and questions successfully', async () => {
    const fetchChain = chain({ data: ORIGINAL_SURVEY });
    const insertChain = chain({ data: { id: NEW_SURVEY_ID } });
    const questionsSelectChain = chain({ data: QUESTIONS });
    const questionsInsertChain = chain({ data: null, error: null });

    let fromCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'surveys') {
        fromCallCount++;

        // 1st call: fetch original, 2nd call: insert copy
        return fromCallCount === 1 ? fetchChain : insertChain;
      }

      if (table === 'survey_questions') {
        fromCallCount++;

        // 3rd call: select questions, 4th call: insert questions
        return fromCallCount === 3 ? questionsSelectChain : questionsInsertChain;
      }

      return chain();
    });

    const { duplicateSurvey } = await import('./duplicate-survey');
    const result = await duplicateSurvey({ surveyId: SURVEY_ID });

    expect(result).toEqual({ success: true, data: { surveyId: NEW_SURVEY_ID } });
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER.id,
        title: `${ORIGINAL_SURVEY.title} (copy)`,
        status: 'draft',
      })
    );
  });

  // Original survey fetch returns null/error → surveys.errors.unexpected.
  it('should return error when original survey not found', async () => {
    const fetchChain = chain({ data: null, error: { message: 'Not found' } });
    mockFrom.mockReturnValue(fetchChain);

    const { duplicateSurvey } = await import('./duplicate-survey');
    const result = await duplicateSurvey({ surveyId: SURVEY_ID });

    expect(result).toEqual({ error: 'surveys.errors.unexpected' });
  });

  // Survey insert returns error → surveys.errors.unexpected.
  it('should return error when insert fails', async () => {
    const fetchChain = chain({ data: ORIGINAL_SURVEY });
    const insertChain = chain({ data: null, error: { message: 'Insert failed' } });

    let fromCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'surveys') {
        fromCallCount++;

        return fromCallCount === 1 ? fetchChain : insertChain;
      }

      return chain();
    });

    const { duplicateSurvey } = await import('./duplicate-survey');
    const result = await duplicateSurvey({ surveyId: SURVEY_ID });

    expect(result).toEqual({ error: 'surveys.errors.unexpected' });
  });

  // Question copy fails → surveys.errors.unexpected and new survey is deleted.
  it('should clean up new survey when question copy fails', async () => {
    const fetchChain = chain({ data: ORIGINAL_SURVEY });
    const insertChain = chain({ data: { id: NEW_SURVEY_ID } });
    const questionsSelectChain = chain({ data: QUESTIONS });
    const questionsInsertChain = chain({
      data: null,
      error: { message: 'Insert questions failed' },
    });
    const deleteChain = chain({ data: null, error: null });

    let surveysCallCount = 0;
    let questionsCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'surveys') {
        surveysCallCount++;

        if (surveysCallCount === 1) {
          return fetchChain;
        }

        if (surveysCallCount === 2) {
          return insertChain;
        }

        return deleteChain; // cleanup delete
      }

      if (table === 'survey_questions') {
        questionsCallCount++;

        return questionsCallCount === 1 ? questionsSelectChain : questionsInsertChain;
      }

      return chain();
    });

    const { duplicateSurvey } = await import('./duplicate-survey');
    const result = await duplicateSurvey({ surveyId: SURVEY_ID });

    expect(result).toEqual({ error: 'surveys.errors.unexpected' });
    expect(deleteChain.delete).toHaveBeenCalled();
    expect(deleteChain.eq).toHaveBeenCalledWith('id', NEW_SURVEY_ID);
  });

  // Original has no questions → success; no question insert.
  it('should duplicate survey with no questions', async () => {
    const fetchChain = chain({ data: ORIGINAL_SURVEY });
    const insertChain = chain({ data: { id: NEW_SURVEY_ID } });
    const questionsSelectChain = chain({ data: [] });

    let surveysCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'surveys') {
        surveysCallCount++;

        return surveysCallCount === 1 ? fetchChain : insertChain;
      }

      if (table === 'survey_questions') {
        return questionsSelectChain;
      }

      return chain();
    });

    const { duplicateSurvey } = await import('./duplicate-survey');
    const result = await duplicateSurvey({ surveyId: SURVEY_ID });

    expect(result).toEqual({ success: true, data: { surveyId: NEW_SURVEY_ID } });
  });
});
