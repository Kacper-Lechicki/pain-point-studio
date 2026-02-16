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

vi.mock('@/features/surveys/lib/generate-slug', () => ({
  generateSurveySlug: vi.fn().mockReturnValue('test-slug1'),
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

function chain(result: { data?: unknown; error?: unknown; count?: number | null } = {}) {
  const obj: {
    data: unknown;
    error: unknown;
    count: unknown;
    [key: string]: unknown;
  } = {
    data: result.data ?? null,
    error: result.error ?? null,
    count: result.count ?? null,
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
const USER = { id: 'user-123', email: 'test@example.com' };

// ── Tests ────────────────────────────────────────────────────────────

describe('Survey Actions – Publish Survey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  // Question count >= min, survey draft found, update succeeds → success and slug.
  it('should publish survey successfully', async () => {
    const countChain = chain({ count: 3 });
    const selectChain = chain({ data: { id: SURVEY_ID } });
    const updateChain = chain({ error: null });

    let fromCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'survey_questions') {
        return countChain;
      }

      if (table === 'surveys') {
        fromCallCount++;

        return fromCallCount === 1 ? selectChain : updateChain;
      }

      return chain();
    });

    const { publishSurvey } = await import('./publish-survey');
    const result = await publishSurvey({ surveyId: SURVEY_ID });

    expect(result).toEqual({ success: true, data: { slug: 'test-slug1' } });
  });

  // Question count below minimum → surveys.builder.errors.minQuestionsToPublish.
  it('should return error when question count is below minimum', async () => {
    const countChain = chain({ count: 0 });
    mockFrom.mockReturnValue(countChain);

    const { publishSurvey } = await import('./publish-survey');
    const result = await publishSurvey({ surveyId: SURVEY_ID });

    expect(result).toEqual({ error: 'surveys.builder.errors.minQuestionsToPublish' });
  });

  // Survey not found or not draft → surveys.errors.unexpected.
  it('should return error when survey not found or not a draft', async () => {
    const countChain = chain({ count: 3 });
    const selectChain = chain({ data: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'survey_questions') {
        return countChain;
      }

      return selectChain;
    });

    const { publishSurvey } = await import('./publish-survey');
    const result = await publishSurvey({ surveyId: SURVEY_ID });

    expect(result).toEqual({ error: 'surveys.errors.unexpected' });
  });

  // endsAt in the past → surveys.errors.unexpected.
  it('should return error when endsAt is in the past', async () => {
    const countChain = chain({ count: 3 });
    const selectChain = chain({ data: { id: SURVEY_ID } });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'survey_questions') {
        return countChain;
      }

      return selectChain;
    });

    const pastDate = new Date(Date.now() - 86_400_000).toISOString();

    const { publishSurvey } = await import('./publish-survey');
    const result = await publishSurvey({ surveyId: SURVEY_ID, endsAt: pastDate });

    expect(result).toEqual({ error: 'surveys.errors.unexpected' });
  });

  // Slug unique violation on first update → new slug generated and retry; success on second.
  it('should retry on slug collision up to 3 times', async () => {
    const countChain = chain({ count: 3 });
    const selectChain = chain({ data: { id: SURVEY_ID } });
    const collisionChain = chain({ error: { code: '23505', message: 'unique violation' } });
    const successChain = chain({ error: null });

    let surveysCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'survey_questions') {
        return countChain;
      }

      if (table === 'surveys') {
        surveysCallCount++;

        if (surveysCallCount === 1) {
          return selectChain;
        }

        if (surveysCallCount === 2) {
          return collisionChain;
        } // 1st attempt: collision

        return successChain; // 2nd attempt: success
      }

      return chain();
    });

    const { generateSurveySlug } = await import('@/features/surveys/lib/generate-slug');

    vi.mocked(generateSurveySlug)
      .mockReturnValueOnce('slug-collide')
      .mockReturnValueOnce('slug-unique');

    const { publishSurvey } = await import('./publish-survey');
    const result = await publishSurvey({ surveyId: SURVEY_ID });

    expect(result).toEqual({ success: true, data: { slug: 'slug-unique' } });
    expect(generateSurveySlug).toHaveBeenCalledTimes(2);
  });

  // All slug attempts hit unique violation → surveys.errors.unexpected.
  it('should return error after max retries on slug collision', async () => {
    const countChain = chain({ count: 3 });
    const selectChain = chain({ data: { id: SURVEY_ID } });
    const collisionChain = chain({ error: { code: '23505', message: 'unique violation' } });

    let surveysCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'survey_questions') {
        return countChain;
      }

      if (table === 'surveys') {
        surveysCallCount++;

        if (surveysCallCount === 1) {
          return selectChain;
        }

        return collisionChain; // all attempts collide
      }

      return chain();
    });

    const { publishSurvey } = await import('./publish-survey');
    const result = await publishSurvey({ surveyId: SURVEY_ID });

    expect(result).toEqual({ error: 'surveys.errors.unexpected' });
  });

  // endsAt and maxRespondents passed → update called with those values.
  it('should set endsAt and maxRespondents when provided', async () => {
    const countChain = chain({ count: 3 });
    const selectChain = chain({ data: { id: SURVEY_ID } });
    const updateChain = chain({ error: null });

    let surveysCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'survey_questions') {
        return countChain;
      }

      if (table === 'surveys') {
        surveysCallCount++;

        return surveysCallCount === 1 ? selectChain : updateChain;
      }

      return chain();
    });

    const futureDate = new Date(Date.now() + 86_400_000).toISOString();

    const { publishSurvey } = await import('./publish-survey');
    const result = await publishSurvey({
      surveyId: SURVEY_ID,
      endsAt: futureDate,
      maxRespondents: 50,
    });

    expect(result).toEqual({ success: true, data: { slug: 'test-slug1' } });
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
        slug: 'test-slug1',
        ends_at: futureDate,
        max_respondents: 50,
      })
    );
  });
});
