/** Tests for survey constraint constants and the surveyCompletedKey helper. */
import { describe, expect, it } from 'vitest';

import {
  DATE_FORMAT_SHORT,
  ESTIMATED_SECONDS_PER_QUESTION,
  OPEN_TEXT_DEFAULT_MAX_LENGTH,
  QUESTIONS_MAX,
  QUESTIONS_MIN,
  QUESTION_DESCRIPTION_MAX_LENGTH,
  QUESTION_OPTIONS_MAX,
  QUESTION_OPTIONS_MIN,
  QUESTION_OPTION_MAX_LENGTH,
  QUESTION_TEXT_MAX_LENGTH,
  RATING_SCALE_MAX,
  RATING_SCALE_MIN,
  SHORT_TEXT_DEFAULT_MAX_LENGTH,
  START_DATE_TOLERANCE_MS,
  SURVEY_DESCRIPTION_MAX_LENGTH,
  SURVEY_MAX_RESPONDENTS_MIN,
  SURVEY_TITLE_MAX_LENGTH,
  surveyCompletedKey,
} from './constraints';

// ── Survey metadata constraints ─────────────────────────────────────

describe('survey metadata constraints', () => {
  it('should have a positive SURVEY_TITLE_MAX_LENGTH', () => {
    expect(SURVEY_TITLE_MAX_LENGTH).toBeGreaterThan(0);
  });

  it('should have SURVEY_DESCRIPTION_MAX_LENGTH greater than title', () => {
    expect(SURVEY_DESCRIPTION_MAX_LENGTH).toBeGreaterThan(SURVEY_TITLE_MAX_LENGTH);
  });

  it('should have SURVEY_MAX_RESPONDENTS_MIN at least 1', () => {
    expect(SURVEY_MAX_RESPONDENTS_MIN).toBeGreaterThanOrEqual(1);
  });
});

// ── Question builder constraints ────────────────────────────────────

describe('question builder constraints', () => {
  it('should have QUESTIONS_MIN less than QUESTIONS_MAX', () => {
    expect(QUESTIONS_MIN).toBeLessThan(QUESTIONS_MAX);
  });

  it('should have QUESTION_OPTIONS_MIN less than QUESTION_OPTIONS_MAX', () => {
    expect(QUESTION_OPTIONS_MIN).toBeLessThan(QUESTION_OPTIONS_MAX);
  });

  it('should have RATING_SCALE_MIN less than RATING_SCALE_MAX', () => {
    expect(RATING_SCALE_MIN).toBeLessThan(RATING_SCALE_MAX);
  });

  it('should have positive text constraints', () => {
    expect(QUESTION_TEXT_MAX_LENGTH).toBeGreaterThan(0);
    expect(QUESTION_DESCRIPTION_MAX_LENGTH).toBeGreaterThan(0);
    expect(QUESTION_OPTION_MAX_LENGTH).toBeGreaterThan(0);
  });
});

// ── Other constants ─────────────────────────────────────────────────

describe('miscellaneous constants', () => {
  it('should have a positive ESTIMATED_SECONDS_PER_QUESTION', () => {
    expect(ESTIMATED_SECONDS_PER_QUESTION).toBeGreaterThan(0);
  });

  it('should have positive text defaults', () => {
    expect(OPEN_TEXT_DEFAULT_MAX_LENGTH).toBeGreaterThan(0);
    expect(SHORT_TEXT_DEFAULT_MAX_LENGTH).toBeGreaterThan(0);
  });

  it('should have a positive START_DATE_TOLERANCE_MS', () => {
    expect(START_DATE_TOLERANCE_MS).toBeGreaterThan(0);
  });

  it('should have required Intl keys in DATE_FORMAT_SHORT', () => {
    expect(DATE_FORMAT_SHORT).toHaveProperty('month');
    expect(DATE_FORMAT_SHORT).toHaveProperty('day');
    expect(DATE_FORMAT_SHORT).toHaveProperty('year');
  });
});

// ── surveyCompletedKey ──────────────────────────────────────────────

describe('surveyCompletedKey', () => {
  it('should prefix slug with pps_completed_', () => {
    expect(surveyCompletedKey('abc123')).toBe('pps_completed_abc123');
  });

  it('should work with empty slug', () => {
    expect(surveyCompletedKey('')).toBe('pps_completed_');
  });
});
