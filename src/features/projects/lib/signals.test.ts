/** Tests for the auto-findings generation engine. */
import { describe, expect, it } from 'vitest';

import type {
  QuestionSignalData,
  SurveySignalData,
} from '@/features/projects/actions/get-project-signals-data';
import type { Finding } from '@/features/projects/types';

import { generateFindings } from './signals';

// ── Helpers ────────────────────────────────────────────────────────────

function makeQuestion(
  type: QuestionSignalData['type'],
  answers: QuestionSignalData['answers'],
  overrides: Partial<QuestionSignalData> = {}
): QuestionSignalData {
  return {
    id: crypto.randomUUID(),
    text: `Test ${type} question`,
    type,
    config: type === 'rating_scale' ? { min: 1, max: 5 } : {},
    answers,
    ...overrides,
  };
}

function makeSurveyData(overrides: Partial<SurveySignalData> = {}): SurveySignalData {
  return {
    surveyId: crypto.randomUUID(),
    surveyTitle: 'Test Survey',
    researchPhase: null,
    totalResponses: 10,
    completedResponses: 10,
    questions: [],
    ...overrides,
  };
}

function yesNoAnswers(yesCount: number, noCount: number) {
  return [
    ...Array.from({ length: yesCount }, () => ({ value: { answer: true } })),
    ...Array.from({ length: noCount }, () => ({ value: { answer: false } })),
  ];
}

function ratingAnswers(ratings: number[]) {
  return ratings.map((r) => ({ value: { rating: r } }));
}

function mcAnswers(selections: string[][]) {
  return selections.map((s) => ({ value: { selected: s } }));
}

// ── generateFindings ──────────────────────────────────────────────────

describe('generateFindings', () => {
  // ── Empty / no data ─────────────────────────────────────────────────

  it('returns empty array for no surveys', () => {
    const result = generateFindings([]);

    expect(result).toHaveLength(0);
  });

  it('returns empty array for surveys without questions', () => {
    const result = generateFindings([makeSurveyData({ questions: [] })]);

    // Only completion_rate could fire, but 10/10 = 100% so no finding
    expect(result).toHaveLength(0);
  });

  // ── Yes/No ──────────────────────────────────────────────────────────

  it('generates finding for yes/no > 70%', () => {
    const result = generateFindings([
      makeSurveyData({
        questions: [makeQuestion('yes_no', yesNoAnswers(8, 2))],
      }),
    ]);

    const finding = result.find((f: Finding) => f.source === 'yes_no');

    expect(finding).toBeDefined();
    expect(finding!.value).toBe(0.8);
  });

  it('generates finding for yes/no < 40%', () => {
    const result = generateFindings([
      makeSurveyData({
        questions: [makeQuestion('yes_no', yesNoAnswers(3, 7))],
      }),
    ]);

    const finding = result.find((f: Finding) => f.source === 'yes_no');

    expect(finding).toBeDefined();
    expect(finding!.value).toBe(0.3);
  });

  it('generates no finding for yes/no between 40-70%', () => {
    const result = generateFindings([
      makeSurveyData({
        questions: [makeQuestion('yes_no', yesNoAnswers(5, 5))],
      }),
    ]);

    const finding = result.find((f: Finding) => f.source === 'yes_no');

    expect(finding).toBeUndefined();
  });

  it('generates finding at exactly 70% boundary', () => {
    const result = generateFindings([
      makeSurveyData({
        questions: [makeQuestion('yes_no', yesNoAnswers(7, 3))],
      }),
    ]);

    const finding = result.find((f: Finding) => f.source === 'yes_no');

    expect(finding).toBeDefined();
    expect(finding!.value).toBe(0.7);
  });

  it('generates finding at exactly 40% boundary', () => {
    const result = generateFindings([
      makeSurveyData({
        questions: [makeQuestion('yes_no', yesNoAnswers(4, 6))],
      }),
    ]);

    const finding = result.find((f: Finding) => f.source === 'yes_no');

    expect(finding).toBeDefined();
    expect(finding!.value).toBe(0.4);
  });

  it('skips yes/no questions with no boolean answers', () => {
    const result = generateFindings([
      makeSurveyData({
        questions: [makeQuestion('yes_no', [])],
      }),
    ]);

    expect(result.find((f: Finding) => f.source === 'yes_no')).toBeUndefined();
  });

  // ── Rating ──────────────────────────────────────────────────────────

  it('generates finding for avg rating >= 4.0', () => {
    const result = generateFindings([
      makeSurveyData({
        questions: [makeQuestion('rating_scale', ratingAnswers([5, 4, 5, 4, 4]))],
      }),
    ]);

    const finding = result.find((f: Finding) => f.source === 'rating');

    expect(finding).toBeDefined();
    expect(finding!.value).toBeCloseTo(4.4);
    expect(finding!.detail).toBe('5');
  });

  it('generates finding for avg rating <= 2.5', () => {
    const result = generateFindings([
      makeSurveyData({
        questions: [makeQuestion('rating_scale', ratingAnswers([1, 2, 3, 2, 2]))],
      }),
    ]);

    const finding = result.find((f: Finding) => f.source === 'rating');

    expect(finding).toBeDefined();
    expect(finding!.value).toBe(2);
  });

  it('generates no finding for avg rating between 2.5 and 4.0', () => {
    const result = generateFindings([
      makeSurveyData({
        questions: [makeQuestion('rating_scale', ratingAnswers([3, 3, 3, 4, 3]))],
      }),
    ]);

    const finding = result.find((f: Finding) => f.source === 'rating');

    expect(finding).toBeUndefined();
  });

  it('generates finding at exactly 4.0 boundary', () => {
    const result = generateFindings([
      makeSurveyData({
        questions: [makeQuestion('rating_scale', ratingAnswers([4, 4, 4, 4, 4]))],
      }),
    ]);

    const finding = result.find((f: Finding) => f.source === 'rating');

    expect(finding).toBeDefined();
  });

  it('generates finding at exactly 2.5 boundary', () => {
    const result = generateFindings([
      makeSurveyData({
        questions: [makeQuestion('rating_scale', ratingAnswers([2, 3, 2, 3, 2, 3]))],
      }),
    ]);

    const finding = result.find((f: Finding) => f.source === 'rating');

    expect(finding).toBeDefined();
  });

  it('skips rating questions with no numeric answers', () => {
    const result = generateFindings([
      makeSurveyData({
        questions: [makeQuestion('rating_scale', [])],
      }),
    ]);

    expect(result.find((f: Finding) => f.source === 'rating')).toBeUndefined();
  });

  it('uses config.max for rating detail', () => {
    const result = generateFindings([
      makeSurveyData({
        questions: [
          makeQuestion('rating_scale', ratingAnswers([9, 10, 9, 10, 10]), {
            config: { min: 1, max: 10 },
          }),
        ],
      }),
    ]);

    const finding = result.find((f: Finding) => f.source === 'rating');

    expect(finding!.detail).toBe('10');
  });

  // ── Multiple Choice ─────────────────────────────────────────────────

  it('generates finding for MC dominant option > 50%', () => {
    const result = generateFindings([
      makeSurveyData({
        questions: [
          makeQuestion('multiple_choice', mcAnswers([['A'], ['A'], ['A'], ['B'], ['C']])),
        ],
      }),
    ]);

    const finding = result.find((f: Finding) => f.source === 'multiple_choice');

    expect(finding).toBeDefined();
    expect(finding!.value).toBe(0.6);
    expect(finding!.detail).toBe('A');
  });

  it('generates no finding when no option exceeds 50%', () => {
    const result = generateFindings([
      makeSurveyData({
        questions: [
          makeQuestion(
            'multiple_choice',
            mcAnswers([['A'], ['B'], ['C'], ['A'], ['B'], ['C'], ['A'], ['B'], ['C'], ['D']])
          ),
        ],
      }),
    ]);

    const finding = result.find((f: Finding) => f.source === 'multiple_choice');

    expect(finding).toBeUndefined();
  });

  it('handles multi-select MC answers (counts respondents, not selections)', () => {
    const result = generateFindings([
      makeSurveyData({
        questions: [makeQuestion('multiple_choice', mcAnswers([['A', 'B'], ['A', 'C'], ['B']]))],
      }),
    ]);

    const finding = result.find((f: Finding) => f.source === 'multiple_choice');

    expect(finding).toBeDefined();
    expect(finding!.detail).toBe('A');
    expect(finding!.value).toBeCloseTo(2 / 3);
  });

  it('skips MC questions with no selected answers', () => {
    const result = generateFindings([
      makeSurveyData({
        questions: [makeQuestion('multiple_choice', [])],
      }),
    ]);

    expect(result.find((f: Finding) => f.source === 'multiple_choice')).toBeUndefined();
  });

  // ── Completion rate ─────────────────────────────────────────────────

  it('generates finding for completion rate < 50%', () => {
    const result = generateFindings([
      makeSurveyData({
        totalResponses: 10,
        completedResponses: 4,
        questions: [],
      }),
    ]);

    const finding = result.find((f: Finding) => f.source === 'completion_rate');

    expect(finding).toBeDefined();
    expect(finding!.value).toBe(0.4);
  });

  it('generates no finding for completion rate >= 50%', () => {
    const result = generateFindings([
      makeSurveyData({
        totalResponses: 10,
        completedResponses: 6,
        questions: [],
      }),
    ]);

    const finding = result.find((f: Finding) => f.source === 'completion_rate');

    expect(finding).toBeUndefined();
  });

  it('generates finding at exactly 50% completion boundary', () => {
    const result = generateFindings([
      makeSurveyData({
        totalResponses: 10,
        completedResponses: 5,
        questions: [],
      }),
    ]);

    const finding = result.find((f: Finding) => f.source === 'completion_rate');

    expect(finding).toBeDefined();
  });

  it('skips completion rate when totalResponses is 0', () => {
    const result = generateFindings([
      makeSurveyData({
        totalResponses: 0,
        completedResponses: 0,
        questions: [],
      }),
    ]);

    const finding = result.find((f: Finding) => f.source === 'completion_rate');

    expect(finding).toBeUndefined();
  });

  // ── Ignored question types ──────────────────────────────────────────

  it('ignores open_text questions', () => {
    const result = generateFindings([
      makeSurveyData({
        questions: [makeQuestion('open_text', [{ value: { text: 'some feedback' } }])],
      }),
    ]);

    const findings = result.filter((f: Finding) => f.source !== 'completion_rate');

    expect(findings).toHaveLength(0);
  });

  it('ignores short_text questions', () => {
    const result = generateFindings([
      makeSurveyData({
        questions: [makeQuestion('short_text', [{ value: { text: 'short answer' } }])],
      }),
    ]);

    const findings = result.filter((f: Finding) => f.source !== 'completion_rate');

    expect(findings).toHaveLength(0);
  });

  // ── Mixed / integration scenarios ───────────────────────────────────

  it('generates findings from multiple question types in one survey', () => {
    const result = generateFindings([
      makeSurveyData({
        questions: [
          makeQuestion('yes_no', yesNoAnswers(8, 2)),
          makeQuestion('rating_scale', ratingAnswers([1, 2, 2, 1, 2])),
          makeQuestion('multiple_choice', mcAnswers([['A'], ['A'], ['A'], ['B']])),
        ],
      }),
    ]);

    expect(result.find((f: Finding) => f.source === 'yes_no')).toBeDefined();
    expect(result.find((f: Finding) => f.source === 'rating')).toBeDefined();
    expect(result.find((f: Finding) => f.source === 'multiple_choice')).toBeDefined();
  });

  it('generates findings from multiple surveys', () => {
    const result = generateFindings([
      makeSurveyData({
        surveyTitle: 'Survey A',
        questions: [makeQuestion('yes_no', yesNoAnswers(9, 1))],
      }),
      makeSurveyData({
        surveyTitle: 'Survey B',
        questions: [makeQuestion('yes_no', yesNoAnswers(2, 8))],
      }),
    ]);

    const findings = result.filter((f: Finding) => f.source === 'yes_no');

    expect(findings).toHaveLength(2);
  });

  it('includes questionText and surveyTitle in findings', () => {
    const result = generateFindings([
      makeSurveyData({
        surveyTitle: 'My Important Survey',
        questions: [
          makeQuestion('yes_no', yesNoAnswers(9, 1), { text: 'Do you experience this problem?' }),
        ],
      }),
    ]);

    const finding = result.find((f: Finding) => f.source === 'yes_no')!;

    expect(finding.questionText).toBe('Do you experience this problem?');
    expect(finding.surveyTitle).toBe('My Important Survey');
  });

  it('returns empty array for empty input', () => {
    const result = generateFindings([]);

    expect(result).toHaveLength(0);
  });
});
