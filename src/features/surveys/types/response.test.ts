import { describe, expect, it } from 'vitest';

import { saveAnswerSchema, startResponseSchema, submitResponseSchema } from './response';

// ── startResponseSchema ─────────────────────────────────────────────

describe('startResponseSchema', () => {
  it('accepts valid UUID', () => {
    const result = startResponseSchema.safeParse({
      surveyId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });

    expect(result.success).toBe(true);
  });

  it('rejects non-UUID', () => {
    const result = startResponseSchema.safeParse({ surveyId: 'not-a-uuid' });

    expect(result.success).toBe(false);
  });
});

// ── saveAnswerSchema ────────────────────────────────────────────────

describe('saveAnswerSchema', () => {
  it('accepts valid answer data', () => {
    const result = saveAnswerSchema.safeParse({
      responseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      questionId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      value: { text: 'My answer' },
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid responseId', () => {
    const result = saveAnswerSchema.safeParse({
      responseId: 'bad',
      questionId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      value: {},
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid questionId', () => {
    const result = saveAnswerSchema.safeParse({
      responseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      questionId: 'bad',
      value: {},
    });

    expect(result.success).toBe(false);
  });
});

// ── submitResponseSchema ────────────────────────────────────────────

describe('submitResponseSchema', () => {
  it('accepts minimal valid submission', () => {
    const result = submitResponseSchema.safeParse({
      responseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });

    expect(result.success).toBe(true);
  });

  it('accepts submission with contact info', () => {
    const result = submitResponseSchema.safeParse({
      responseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      contactName: 'John Doe',
      contactEmail: 'john@example.com',
      feedback: 'Great survey!',
    });

    expect(result.success).toBe(true);
  });

  it('accepts empty contactEmail string', () => {
    const result = submitResponseSchema.safeParse({
      responseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      contactEmail: '',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid contactEmail', () => {
    const result = submitResponseSchema.safeParse({
      responseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      contactEmail: 'not-an-email',
    });

    expect(result.success).toBe(false);
  });

  it('rejects contactName exceeding 100 chars', () => {
    const result = submitResponseSchema.safeParse({
      responseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      contactName: 'a'.repeat(101),
    });

    expect(result.success).toBe(false);
  });

  it('rejects feedback exceeding 2000 chars', () => {
    const result = submitResponseSchema.safeParse({
      responseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      feedback: 'a'.repeat(2001),
    });

    expect(result.success).toBe(false);
  });
});
