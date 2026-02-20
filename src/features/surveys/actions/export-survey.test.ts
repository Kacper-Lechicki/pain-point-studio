// @vitest-environment node
/** Tests for exporting survey responses as CSV and JSON. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

const SURVEY_ID = '00000000-0000-4000-8000-000000000001';
const USER_ID = 'user-1';
const survey = { id: SURVEY_ID, title: 'Customer Feedback 2025' };

const questions = [
  { id: 'q1', text: 'How do you feel?', type: 'open_text', sort_order: 0 },
  { id: 'q2', text: 'Pick features', type: 'multiple_choice', sort_order: 1 },
  { id: 'q3', text: 'Rate us', type: 'rating_scale', sort_order: 2 },
  { id: 'q4', text: 'Would recommend?', type: 'yes_no', sort_order: 3 },
];

const responses = [
  {
    id: 'r1',
    completed_at: '2025-01-15T10:00:00Z',
    contact_name: 'Alice',
    contact_email: 'alice@example.com',
    feedback: 'Great survey',
  },
];

const answers = [
  { response_id: 'r1', question_id: 'q1', value: { text: 'Feeling good' } },
  { response_id: 'r1', question_id: 'q2', value: { selected: ['Dark mode', 'API'] } },
  { response_id: 'r1', question_id: 'q3', value: { rating: 9 } },
  { response_id: 'r1', question_id: 'q4', value: { answer: true } },
];

// ── Supabase mock ───────────────────────────────────────────────────

let mockSurveyData: unknown;
let mockQuestionsData: unknown;
let mockAnswersData: unknown;
let mockResponsesData: unknown;
let mockResponseCount: number | null;

/**
 * Build a mock supabase client that simulates PostgREST query builder chains.
 * The action calls:
 *   - supabase.from('survey_responses').select('*', { count, head }).eq().eq()  → { count }
 *   - supabase.from('surveys').select('id, title').eq().eq().maybeSingle()      → { data: survey }
 *   - supabase.from('survey_questions').select(...).eq().order()                → { data: questions }
 *   - supabase.rpc('get_export_responses', ...)                                → { data: responses }
 *   - supabase.from('survey_answers').select(...).in(...)                       → { data: answers }
 */
function createMockSupabase() {
  return {
    from: vi.fn((table: string) => {
      if (table === 'survey_responses') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: mockResponseCount, error: null }),
            }),
          }),
        };
      }

      if (table === 'surveys') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: mockSurveyData, error: null }),
              }),
            }),
          }),
        };
      }

      if (table === 'survey_questions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockQuestionsData, error: null }),
            }),
          }),
        };
      }

      if (table === 'survey_answers') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: mockAnswersData, error: null }),
          }),
        };
      }

      return {};
    }),
    rpc: vi
      .fn()
      .mockImplementation(() => Promise.resolve({ data: mockResponsesData, error: null })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: USER_ID } },
        error: null,
      }),
    },
  };
}

let mockSupabase = createMockSupabase();

interface MockProtectedActionConfig {
  action: (params: {
    data: unknown;
    user: { id: string; email: string };
    supabase: unknown;
  }) => Promise<{ error?: string; success?: boolean; data?: unknown }>;
  schema: {
    safeParse: (data: unknown) => { success: boolean; data?: unknown; error?: unknown };
  };
}

vi.mock('@/lib/common/with-protected-action', () => ({
  withProtectedAction: (_key: string, config: MockProtectedActionConfig) => {
    return async (formData: unknown) => {
      const validation = config.schema.safeParse(formData);

      if (!validation.success) {
        return { error: 'settings.errors.invalidData' };
      }

      return config.action({
        data: validation.data,
        user: { id: USER_ID, email: 'test@example.com' },
        supabase: mockSupabase,
      });
    };
  },
}));

const validInput = { surveyId: SURVEY_ID };

// ── exportSurveyCSV ─────────────────────────────────────────────────

describe('exportSurveyCSV', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSurveyData = survey;
    mockQuestionsData = questions;
    mockAnswersData = answers;
    mockResponsesData = responses;
    mockResponseCount = 1;
    mockSupabase = createMockSupabase();
  });

  it('should return error when survey not found', async () => {
    mockSurveyData = null;

    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });

  it('should return CSV with correct headers', async () => {
    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.success).toBe(true);

    const lines = result.data!.csv.split('\n');
    const headerLine = lines[0];

    expect(headerLine).toContain('Response ID');
    expect(headerLine).toContain('Completed At');
    expect(headerLine).toContain('Contact Name');
    expect(headerLine).toContain('Contact Email');
    expect(headerLine).toContain('Feedback');
    expect(headerLine).toContain('How do you feel?');
    expect(headerLine).toContain('Pick features');
    expect(headerLine).toContain('Rate us');
    expect(headerLine).toContain('Would recommend?');
  });

  it('should format open_text answers correctly', async () => {
    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('Feeling good');
  });

  it('should format multiple_choice answers with selected options joined by "; "', async () => {
    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('Dark mode; API');
  });

  it('should format multiple_choice answers with "other" value', async () => {
    mockAnswersData = [
      {
        response_id: 'r1',
        question_id: 'q2',
        value: { selected: ['Dark mode'], other: 'Custom theme' },
      },
    ];

    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('Dark mode; Other: Custom theme');
  });

  it('should format rating_scale answers', async () => {
    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('9');
  });

  it('should format yes_no answers as Yes', async () => {
    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('Yes');
  });

  it('should format yes_no answers as No', async () => {
    mockAnswersData = [{ response_id: 'r1', question_id: 'q4', value: { answer: false } }];

    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('No');
  });

  it('should escape CSV fields with commas', async () => {
    mockAnswersData = [{ response_id: 'r1', question_id: 'q1', value: { text: 'Hello, world' } }];

    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('"Hello, world"');
  });

  it('should escape CSV fields with double quotes', async () => {
    mockAnswersData = [{ response_id: 'r1', question_id: 'q1', value: { text: 'She said "hi"' } }];

    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('"She said ""hi"""');
  });

  it('should prevent formula injection by prefixing = with tab', async () => {
    mockAnswersData = [{ response_id: 'r1', question_id: 'q1', value: { text: '=SUM(A1)' } }];

    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('\t=SUM(A1)');
  });

  it('should prevent formula injection by prefixing + with tab', async () => {
    mockAnswersData = [{ response_id: 'r1', question_id: 'q1', value: { text: '+cmd' } }];

    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('\t+cmd');
  });

  it('should prevent formula injection by prefixing - with tab', async () => {
    mockAnswersData = [{ response_id: 'r1', question_id: 'q1', value: { text: '-1+1' } }];

    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('\t-1+1');
  });

  it('should prevent formula injection by prefixing @ with tab', async () => {
    mockAnswersData = [{ response_id: 'r1', question_id: 'q1', value: { text: '@mention' } }];

    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('\t@mention');
  });

  it('should generate correct filename from survey title', async () => {
    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.filename).toBe('customer-feedback-2025-responses.csv');
  });

  it('should return empty answer cells when response has no answers', async () => {
    mockAnswersData = [];

    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);
    const lines = result.data!.csv.split('\n');
    const dataRow = lines[1];
    const fields = dataRow?.split(',');

    // After the 5 base fields (id, completedAt, name, email, feedback),
    // all question fields should be empty
    expect(fields?.slice(5).every((f) => f === '')).toBe(true);
  });
});

// ── exportSurveyJSON ────────────────────────────────────────────────

describe('exportSurveyJSON', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSurveyData = survey;
    mockQuestionsData = questions;
    mockAnswersData = answers;
    mockResponsesData = responses;
    mockResponseCount = 1;
    mockSupabase = createMockSupabase();
  });

  it('should return error when survey not found', async () => {
    mockSurveyData = null;

    const { exportSurveyJSON } = await import('./export-survey');
    const result = await exportSurveyJSON(validInput);

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });

  it('should return JSON with correct structure', async () => {
    const { exportSurveyJSON } = await import('./export-survey');
    const result = await exportSurveyJSON(validInput);

    expect(result.success).toBe(true);

    const parsed = JSON.parse(result.data!.json);

    expect(parsed).toHaveProperty('survey');
    expect(parsed).toHaveProperty('questions');
    expect(parsed).toHaveProperty('responses');
    expect(parsed.survey).toEqual({ id: SURVEY_ID, title: 'Customer Feedback 2025' });
  });

  it('should map question fields correctly', async () => {
    const { exportSurveyJSON } = await import('./export-survey');
    const result = await exportSurveyJSON(validInput);
    const parsed = JSON.parse(result.data!.json);
    const q = parsed.questions[0];

    expect(q).toEqual({
      id: 'q1',
      text: 'How do you feel?',
      type: 'open_text',
      sortOrder: 0,
    });
  });

  it('should map response fields correctly', async () => {
    const { exportSurveyJSON } = await import('./export-survey');
    const result = await exportSurveyJSON(validInput);
    const parsed = JSON.parse(result.data!.json);
    const r = parsed.responses[0];

    expect(r.id).toBe('r1');
    expect(r.completedAt).toBe('2025-01-15T10:00:00Z');
    expect(r.contactName).toBe('Alice');
    expect(r.contactEmail).toBe('alice@example.com');
    expect(r.feedback).toBe('Great survey');
  });

  it('should include answer values in responses', async () => {
    const { exportSurveyJSON } = await import('./export-survey');
    const result = await exportSurveyJSON(validInput);
    const parsed = JSON.parse(result.data!.json);
    const responseAnswers = parsed.responses[0].answers;

    expect(responseAnswers).toHaveLength(4);
    expect(responseAnswers[0]).toEqual({
      questionId: 'q1',
      questionText: 'How do you feel?',
      type: 'open_text',
      value: { text: 'Feeling good' },
    });
  });

  it('should return null for missing answer values', async () => {
    mockAnswersData = [];

    const { exportSurveyJSON } = await import('./export-survey');
    const result = await exportSurveyJSON(validInput);
    const parsed = JSON.parse(result.data!.json);
    const responseAnswers = parsed.responses[0].answers;

    expect(responseAnswers.every((a: { value: unknown }) => a.value === null)).toBe(true);
  });

  it('should generate correct filename from survey title', async () => {
    const { exportSurveyJSON } = await import('./export-survey');
    const result = await exportSurveyJSON(validInput);

    expect(result.data!.filename).toBe('customer-feedback-2025-responses.json');
  });
});
