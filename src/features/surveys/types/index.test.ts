/** Tests for survey type Zod schemas (metadata, question configs, question, survey questions). */
import { describe, expect, it } from 'vitest';

import {
  multipleChoiceConfigSchema,
  questionSchema,
  ratingScaleConfigSchema,
  surveyIdSchema,
  surveyMetadataSchema,
  surveyQuestionsSchema,
  textConfigSchema,
} from '.';

// ── surveyIdSchema ──────────────────────────────────────────────────

describe('surveyIdSchema', () => {
  it('should accept valid UUID', () => {
    const result = surveyIdSchema.safeParse({ surveyId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' });

    expect(result.success).toBe(true);
  });

  it('should reject non-UUID string', () => {
    const result = surveyIdSchema.safeParse({ surveyId: 'not-a-uuid' });

    expect(result.success).toBe(false);
  });
});

// ── surveyMetadataSchema ────────────────────────────────────────────

describe('surveyMetadataSchema', () => {
  const validData = {
    title: 'My Survey',
    description: 'A test survey',
    category: 'project-idea-evaluation',
    visibility: 'public' as const,
  };

  it('should accept valid minimal data', () => {
    const result = surveyMetadataSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  it('should reject empty title', () => {
    const result = surveyMetadataSchema.safeParse({ ...validData, title: '' });

    expect(result.success).toBe(false);
  });

  it('should reject title exceeding max length', () => {
    const result = surveyMetadataSchema.safeParse({ ...validData, title: 'a'.repeat(101) });

    expect(result.success).toBe(false);
  });

  it('should reject empty description', () => {
    const result = surveyMetadataSchema.safeParse({ ...validData, description: '' });

    expect(result.success).toBe(false);
  });

  it('should reject empty category', () => {
    const result = surveyMetadataSchema.safeParse({ ...validData, category: '' });

    expect(result.success).toBe(false);
  });

  it('should accept both private and public visibility', () => {
    expect(surveyMetadataSchema.safeParse({ ...validData, visibility: 'private' }).success).toBe(
      true
    );
    expect(surveyMetadataSchema.safeParse({ ...validData, visibility: 'public' }).success).toBe(
      true
    );
  });
});

// ── multipleChoiceConfigSchema ──────────────────────────────────────

describe('multipleChoiceConfigSchema', () => {
  it('should accept valid options', () => {
    const result = multipleChoiceConfigSchema.safeParse({
      options: ['Option A', 'Option B'],
    });

    expect(result.success).toBe(true);
  });

  it('should reject fewer than 2 options', () => {
    const result = multipleChoiceConfigSchema.safeParse({
      options: ['Only one'],
    });

    expect(result.success).toBe(false);
  });

  it('should reject more than 10 options', () => {
    const result = multipleChoiceConfigSchema.safeParse({
      options: Array.from({ length: 11 }, (_, i) => `Option ${i}`),
    });

    expect(result.success).toBe(false);
  });

  it('should accept optional allowOther', () => {
    const result = multipleChoiceConfigSchema.safeParse({
      options: ['A', 'B'],
      allowOther: true,
    });

    expect(result.success).toBe(true);
  });
});

// ── ratingScaleConfigSchema ─────────────────────────────────────────

describe('ratingScaleConfigSchema', () => {
  it('should accept valid scale', () => {
    const result = ratingScaleConfigSchema.safeParse({ min: 1, max: 5 });

    expect(result.success).toBe(true);
  });

  it('should reject min >= max', () => {
    const result = ratingScaleConfigSchema.safeParse({ min: 5, max: 5 });

    expect(result.success).toBe(false);
  });

  it('should reject max exceeding RATING_SCALE_MAX', () => {
    const result = ratingScaleConfigSchema.safeParse({ min: 1, max: 11 });

    expect(result.success).toBe(false);
  });

  it('should accept optional labels', () => {
    const result = ratingScaleConfigSchema.safeParse({
      min: 1,
      max: 10,
      minLabel: 'Bad',
      maxLabel: 'Great',
    });

    expect(result.success).toBe(true);
  });
});

// ── textConfigSchema ────────────────────────────────────────────────

describe('textConfigSchema', () => {
  it('should accept empty config', () => {
    const result = textConfigSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('should accept placeholder and maxLength', () => {
    const result = textConfigSchema.safeParse({
      placeholder: 'Enter text',
      maxLength: 500,
    });

    expect(result.success).toBe(true);
  });

  it('should reject maxLength below 1', () => {
    const result = textConfigSchema.safeParse({ maxLength: 0 });

    expect(result.success).toBe(false);
  });
});

// ── questionSchema ──────────────────────────────────────────────────

describe('questionSchema', () => {
  const validQuestion = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    text: 'How do you feel?',
    type: 'open_text' as const,
    required: true,
  };

  it('should accept valid question', () => {
    const result = questionSchema.safeParse(validQuestion);

    expect(result.success).toBe(true);
  });

  it('should reject empty text', () => {
    const result = questionSchema.safeParse({ ...validQuestion, text: '' });

    expect(result.success).toBe(false);
  });

  it('should reject text exceeding max length', () => {
    const result = questionSchema.safeParse({ ...validQuestion, text: 'a'.repeat(501) });

    expect(result.success).toBe(false);
  });

  it('should reject invalid question type', () => {
    const result = questionSchema.safeParse({ ...validQuestion, type: 'invalid_type' });

    expect(result.success).toBe(false);
  });

  it('should accept all valid question types', () => {
    for (const type of ['open_text', 'short_text', 'multiple_choice', 'rating_scale', 'yes_no']) {
      const result = questionSchema.safeParse({ ...validQuestion, type });

      expect(result.success).toBe(true);
    }
  });

  it('should default config to empty object', () => {
    const result = questionSchema.safeParse(validQuestion);

    if (result.success) {
      expect(result.data.config).toEqual({});
    }
  });
});

// ── surveyQuestionsSchema ───────────────────────────────────────────

describe('surveyQuestionsSchema', () => {
  const makeQuestion = (i: number) => ({
    id: crypto.randomUUID(),
    text: `Question ${i}`,
    type: 'open_text' as const,
    required: false,
    config: {},
    sortOrder: i,
  });

  it('should accept valid questions array', () => {
    const result = surveyQuestionsSchema.safeParse({
      surveyId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      questions: [makeQuestion(0)],
    });

    expect(result.success).toBe(true);
  });

  it('should accept empty questions array (draft save)', () => {
    const result = surveyQuestionsSchema.safeParse({
      surveyId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      questions: [],
    });

    expect(result.success).toBe(true);
  });

  it('should accept question with empty text (draft save)', () => {
    const result = surveyQuestionsSchema.safeParse({
      surveyId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      questions: [{ ...makeQuestion(0), text: '' }],
    });

    expect(result.success).toBe(true);
  });

  it('should reject more than 15 questions', () => {
    const result = surveyQuestionsSchema.safeParse({
      surveyId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      questions: Array.from({ length: 16 }, (_, i) => makeQuestion(i)),
    });

    expect(result.success).toBe(false);
  });
});
