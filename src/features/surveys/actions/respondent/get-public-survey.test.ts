// @vitest-environment node
/** Tests for fetching a public survey by slug with acceptance and closure logic. */
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

const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({ from: mockFrom, rpc: mockRpc }),
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

const SURVEY_ID = crypto.randomUUID();

const ACTIVE_SURVEY = {
  id: SURVEY_ID,
  title: 'Test Survey',
  description: 'A test survey',
  status: 'active',
  ends_at: null,
  max_respondents: null,
  completed_at: null,
};

const QUESTION_ROWS = [
  {
    id: crypto.randomUUID(),
    text: 'How do you feel?',
    type: 'open_text',
    required: true,
    description: null,
    config: {},
    sort_order: 0,
  },
  {
    id: crypto.randomUUID(),
    text: 'Rate us',
    type: 'rating_scale',
    required: false,
    description: 'From 1 to 5',
    config: { min: 1, max: 5 },
    sort_order: 1,
  },
];

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function setupMocks(
  surveyData: unknown,
  questionsData: unknown[] | null = QUESTION_ROWS,
  responseCount: number = 0
) {
  const surveyChain = chain({ data: surveyData });
  const questionsChain = chain({ data: questionsData });

  mockFrom.mockImplementation((table: string) => {
    if (table === 'surveys') {
      return surveyChain;
    }

    if (table === 'survey_questions') {
      return questionsChain;
    }

    return chain();
  });

  mockRpc.mockResolvedValue({ data: responseCount, error: null });
}

// ── Tests ────────────────────────────────────────────────────────────

describe('getPublicSurvey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should return null when survey not found', async () => {
    setupMocks(null);

    const { getPublicSurvey } = await import('./get-public-survey');
    const result = await getPublicSurvey('nonexistent-slug');

    expect(result).toBeNull();
  });

  it('should return active survey with isAcceptingResponses=true', async () => {
    setupMocks(ACTIVE_SURVEY);

    const { getPublicSurvey } = await import('./get-public-survey');
    const result = await getPublicSurvey('test-slug');

    expect(result).toEqual(
      expect.objectContaining({
        id: SURVEY_ID,
        title: 'Test Survey',
        description: 'A test survey',
        isAcceptingResponses: true,
        questionCount: 2,
        responseCount: 0,
      })
    );

    expect(result?.closedReason).toBeUndefined();
  });

  it('should return completed survey with closedReason="completed" within retention window', async () => {
    setupMocks({
      ...ACTIVE_SURVEY,
      status: 'completed',
      completed_at: daysAgo(5),
    });

    const { getPublicSurvey } = await import('./get-public-survey');
    const result = await getPublicSurvey('test-slug');

    expect(result).toEqual(
      expect.objectContaining({
        isAcceptingResponses: false,
        closedReason: 'completed',
      })
    );
  });

  it('should return null for completed survey outside retention window', async () => {
    setupMocks({
      ...ACTIVE_SURVEY,
      status: 'completed',
      completed_at: daysAgo(20),
    });

    const { getPublicSurvey } = await import('./get-public-survey');
    const result = await getPublicSurvey('test-slug');

    expect(result).toBeNull();
  });

  it('should return expired survey with closedReason="expired" when ends_at is in the past', async () => {
    setupMocks({
      ...ACTIVE_SURVEY,
      ends_at: daysAgo(1),
    });

    const { getPublicSurvey } = await import('./get-public-survey');
    const result = await getPublicSurvey('test-slug');

    expect(result).toEqual(
      expect.objectContaining({
        isAcceptingResponses: false,
        closedReason: 'expired',
      })
    );
  });

  it('should return max_reached when response count >= max_respondents', async () => {
    setupMocks({ ...ACTIVE_SURVEY, max_respondents: 50 }, QUESTION_ROWS, 50);

    const { getPublicSurvey } = await import('./get-public-survey');
    const result = await getPublicSurvey('test-slug');

    expect(result).toEqual(
      expect.objectContaining({
        isAcceptingResponses: false,
        closedReason: 'max_reached',
        responseCount: 50,
      })
    );
  });

  it('should return correct question list mapped via mapQuestionRow', async () => {
    setupMocks(ACTIVE_SURVEY);

    const { getPublicSurvey } = await import('./get-public-survey');
    const result = await getPublicSurvey('test-slug');

    expect(result?.questions).toHaveLength(2);

    expect(result?.questions?.[0]).toEqual({
      id: QUESTION_ROWS[0]!.id,
      text: 'How do you feel?',
      type: 'open_text',
      required: true,
      description: null,
      config: {},
      sortOrder: 0,
    });

    expect(result?.questions?.[1]).toEqual({
      id: QUESTION_ROWS[1]!.id,
      text: 'Rate us',
      type: 'rating_scale',
      required: false,
      description: 'From 1 to 5',
      config: { min: 1, max: 5 },
      sortOrder: 1,
    });
  });

  it('should return null when completed_at is null for completed survey', async () => {
    setupMocks({
      ...ACTIVE_SURVEY,
      status: 'completed',
      completed_at: null,
    });

    const { getPublicSurvey } = await import('./get-public-survey');
    const result = await getPublicSurvey('test-slug');

    expect(result).toBeNull();
  });
});
