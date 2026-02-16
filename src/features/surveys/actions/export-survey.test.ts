// @vitest-environment node
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

const mockGetUser = vi.fn();

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

function createChain(resolvedValue: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  for (const method of ['select', 'eq', 'in', 'order', 'single', 'maybeSingle']) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  chain.then = vi.fn().mockImplementation((resolve) => resolve(resolvedValue));

  Object.defineProperty(chain, Symbol.toStringTag, { value: 'Promise' });

  // Make the chain itself thenable so await resolves correctly
  const thenable = Object.assign(Promise.resolve(resolvedValue), chain);

  for (const method of ['select', 'eq', 'in', 'order']) {
    thenable[method] = vi.fn().mockReturnValue(thenable);
  }

  thenable.single = vi.fn().mockReturnValue(Promise.resolve(resolvedValue));

  return thenable;
}

let mockSurveyData: unknown;
let mockQuestionsData: unknown;
let mockAnswersData: unknown;

const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      switch (table) {
        case 'surveys':
          return createSurveyChain();
        case 'survey_questions':
          return createQuestionsChain();
        case 'survey_answers':
          return createAnswersChain();
        default:
          return createChain({ data: null, error: null });
      }
    }),
    rpc: mockRpc,
  })),
}));

function createSurveyChain() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: mockSurveyData, error: null });

  return chain;
}

function createQuestionsChain() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockResolvedValue({ data: mockQuestionsData, error: null });

  return chain;
}

function createAnswersChain() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  chain.select = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockResolvedValue({ data: mockAnswersData, error: null });

  return chain;
}

const validInput = { surveyId: SURVEY_ID };

// ── exportSurveyCSV ─────────────────────────────────────────────────

describe('exportSurveyCSV', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
    mockSurveyData = survey;
    mockQuestionsData = questions;
    mockAnswersData = answers;
    mockRpc.mockResolvedValue({ data: responses, error: null });
  });

  // Survey not found (mock returns null) → error; no success.
  it('returns error when survey not found', async () => {
    mockSurveyData = null;

    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });

  // Success → CSV has Response ID, Completed At, Contact Name, question texts, etc.
  it('returns CSV with correct headers', async () => {
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

  // open_text value.text → cell contains that text.
  it('formats open_text answers correctly', async () => {
    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('Feeling good');
  });

  // multiple_choice selected array → joined by "; " in cell.
  it('formats multiple_choice answers with selected options joined by "; "', async () => {
    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('Dark mode; API');
  });

  // multiple_choice with other → "Option; Other: <other text>" in cell.
  it('formats multiple_choice answers with "other" value', async () => {
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

  // rating_scale value.rating → cell contains number.
  it('formats rating_scale answers', async () => {
    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('9');
  });

  // yes_no value.answer true → "Yes".
  it('formats yes_no answers as Yes', async () => {
    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('Yes');
  });

  // yes_no value.answer false → "No".
  it('formats yes_no answers as No', async () => {
    mockAnswersData = [{ response_id: 'r1', question_id: 'q4', value: { answer: false } }];

    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('No');
  });

  // Field contains comma → wrapped in double quotes.
  it('escapes CSV fields with commas', async () => {
    mockAnswersData = [{ response_id: 'r1', question_id: 'q1', value: { text: 'Hello, world' } }];

    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('"Hello, world"');
  });

  // Field contains double quote → escaped as "".
  it('escapes CSV fields with double quotes', async () => {
    mockAnswersData = [{ response_id: 'r1', question_id: 'q1', value: { text: 'She said "hi"' } }];

    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('"She said ""hi"""');
  });

  // Value starts with = → prefixed with tab to prevent formula execution.
  it('prevents formula injection by prefixing = with tab', async () => {
    mockAnswersData = [{ response_id: 'r1', question_id: 'q1', value: { text: '=SUM(A1)' } }];

    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('\t=SUM(A1)');
  });

  // Value starts with + → prefixed with tab.
  it('prevents formula injection by prefixing + with tab', async () => {
    mockAnswersData = [{ response_id: 'r1', question_id: 'q1', value: { text: '+cmd' } }];

    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('\t+cmd');
  });

  // Value starts with - → prefixed with tab.
  it('prevents formula injection by prefixing - with tab', async () => {
    mockAnswersData = [{ response_id: 'r1', question_id: 'q1', value: { text: '-1+1' } }];

    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('\t-1+1');
  });

  // Value starts with @ → prefixed with tab.
  it('prevents formula injection by prefixing @ with tab', async () => {
    mockAnswersData = [{ response_id: 'r1', question_id: 'q1', value: { text: '@mention' } }];

    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.csv).toContain('\t@mention');
  });

  // Filename derived from slugified survey title and .csv suffix.
  it('generates correct filename from survey title', async () => {
    const { exportSurveyCSV } = await import('./export-survey');
    const result = await exportSurveyCSV(validInput);

    expect(result.data!.filename).toBe('customer-feedback-2025-responses.csv');
  });

  // Response has no answers → question columns are empty strings.
  it('returns empty answer cells when response has no answers', async () => {
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

    mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
    mockSurveyData = survey;
    mockQuestionsData = questions;
    mockAnswersData = answers;
    mockRpc.mockResolvedValue({ data: responses, error: null });
  });

  // Survey not found (mock returns null) → error; no success.
  it('returns error when survey not found', async () => {
    mockSurveyData = null;

    const { exportSurveyJSON } = await import('./export-survey');
    const result = await exportSurveyJSON(validInput);

    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty('success');
  });

  // Success → JSON has survey, questions, responses keys.
  it('returns JSON with correct structure', async () => {
    const { exportSurveyJSON } = await import('./export-survey');
    const result = await exportSurveyJSON(validInput);

    expect(result.success).toBe(true);

    const parsed = JSON.parse(result.data!.json);

    expect(parsed).toHaveProperty('survey');
    expect(parsed).toHaveProperty('questions');
    expect(parsed).toHaveProperty('responses');
    expect(parsed.survey).toEqual({ id: SURVEY_ID, title: 'Customer Feedback 2025' });
  });

  // Question rows mapped to id, text, type, sortOrder.
  it('maps question fields correctly', async () => {
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

  // Response rows mapped to id, completedAt, contactName, contactEmail, feedback.
  it('maps response fields correctly', async () => {
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

  // Each response includes answers array with questionId, questionText, type, value.
  it('includes answer values in responses', async () => {
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

  // No answers for response → answers array has null values.
  it('returns null for missing answer values', async () => {
    mockAnswersData = [];

    const { exportSurveyJSON } = await import('./export-survey');
    const result = await exportSurveyJSON(validInput);

    const parsed = JSON.parse(result.data!.json);
    const responseAnswers = parsed.responses[0].answers;

    expect(responseAnswers.every((a: { value: unknown }) => a.value === null)).toBe(true);
  });

  // Filename derived from slugified survey title and .json suffix.
  it('generates correct filename from survey title', async () => {
    const { exportSurveyJSON } = await import('./export-survey');
    const result = await exportSurveyJSON(validInput);

    expect(result.data!.filename).toBe('customer-feedback-2025-responses.json');
  });
});
