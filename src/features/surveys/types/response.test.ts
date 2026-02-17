/** Tests for survey response Zod schemas (start, save answer, submit). */
import { describe, expect, it } from 'vitest';

import { saveAnswerSchema, startResponseSchema, submitResponseSchema } from './response';

// ── startResponseSchema ─────────────────────────────────────────────

describe('startResponseSchema', () => {
  it('should accept valid UUID', () => {
    const result = startResponseSchema.safeParse({
      surveyId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });

    expect(result.success).toBe(true);
  });

  it('should reject non-UUID', () => {
    const result = startResponseSchema.safeParse({ surveyId: 'not-a-uuid' });

    expect(result.success).toBe(false);
  });
});

// ── saveAnswerSchema ────────────────────────────────────────────────

describe('saveAnswerSchema', () => {
  it('should accept valid answer data', () => {
    const result = saveAnswerSchema.safeParse({
      responseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      questionId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      value: { text: 'My answer' },
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid responseId', () => {
    const result = saveAnswerSchema.safeParse({
      responseId: 'bad',
      questionId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      value: {},
    });

    expect(result.success).toBe(false);
  });

  it('should reject invalid questionId', () => {
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
  it('should accept minimal valid submission', () => {
    const result = submitResponseSchema.safeParse({
      responseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });

    expect(result.success).toBe(true);
  });

  it('should accept submission with contact info', () => {
    const result = submitResponseSchema.safeParse({
      responseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      contactName: 'John Doe',
      contactEmail: 'john@example.com',
      feedback: 'Great survey!',
    });

    expect(result.success).toBe(true);
  });

  it('should accept empty contactEmail string', () => {
    const result = submitResponseSchema.safeParse({
      responseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      contactEmail: '',
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid contactEmail', () => {
    const result = submitResponseSchema.safeParse({
      responseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      contactEmail: 'not-an-email',
    });

    expect(result.success).toBe(false);
  });

  it('should reject contactName exceeding 100 chars', () => {
    const result = submitResponseSchema.safeParse({
      responseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      contactName: 'a'.repeat(101),
    });

    expect(result.success).toBe(false);
  });

  it('should reject feedback exceeding 2000 chars', () => {
    const result = submitResponseSchema.safeParse({
      responseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      feedback: 'a'.repeat(2001),
    });

    expect(result.success).toBe(false);
  });
});
