import { describe, expect, it } from 'vitest';

import type {
  QuestionSignalData,
  SurveySignalData,
} from '@/features/projects/actions/get-project-signals-data';

import { generateInsightSuggestions } from './suggestions';

// ── Helpers ─────────────────────────────────────────────────────────

function makeQuestion(overrides: Partial<QuestionSignalData> = {}): QuestionSignalData {
  return {
    id: 'q1',
    text: 'Test question',
    type: 'yes_no',
    config: {},
    answers: [],
    ...overrides,
  };
}

function makeSurvey(overrides: Partial<SurveySignalData> = {}): SurveySignalData {
  return {
    surveyId: 's1',
    surveyTitle: 'Test Survey',
    researchPhase: null,
    totalResponses: 10,
    completedResponses: 10,
    questions: [],
    ...overrides,
  };
}

function yesNoAnswers(yesCount: number, total: number) {
  return Array.from({ length: total }, (_, i) => ({
    value: { answer: i < yesCount },
  }));
}

function ratingAnswers(ratings: number[]) {
  return ratings.map((r) => ({ value: { rating: r } }));
}

function multipleChoiceAnswers(selections: string[][]) {
  return selections.map((selected) => ({ value: { selected } }));
}

// ── yes_no suggestions ──────────────────────────────────────────────

describe('generateInsightSuggestions — yes_no', () => {
  it('generates strong validation for high yes rate (>=70%)', () => {
    const survey = makeSurvey({
      questions: [makeQuestion({ answers: yesNoAnswers(8, 10) })],
    });

    const results = generateInsightSuggestions([survey], new Set());

    expect(results).toHaveLength(1);
    expect(results[0]!.content).toContain('Strong validation');
    expect(results[0]!.content).toContain('80%');
  });

  it('generates weak validation for low yes rate (<=40%)', () => {
    const survey = makeSurvey({
      questions: [makeQuestion({ answers: yesNoAnswers(3, 10) })],
    });

    const results = generateInsightSuggestions([survey], new Set());

    expect(results).toHaveLength(1);
    expect(results[0]!.content).toContain('Weak validation');
    expect(results[0]!.content).toContain('30%');
  });

  it('generates mixed signal for middle yes rate', () => {
    const survey = makeSurvey({
      questions: [makeQuestion({ answers: yesNoAnswers(5, 10) })],
    });

    const results = generateInsightSuggestions([survey], new Set());

    expect(results).toHaveLength(1);
    expect(results[0]!.content).toContain('Mixed signal');
    expect(results[0]!.content).toContain('50%');
  });

  it('skips questions with no boolean answers', () => {
    const survey = makeSurvey({
      questions: [makeQuestion({ answers: [{ value: { answer: 'not boolean' } }] })],
    });

    const results = generateInsightSuggestions([survey], new Set());

    expect(results).toHaveLength(0);
  });
});

// ── rating_scale suggestions ────────────────────────────────────────

describe('generateInsightSuggestions — rating_scale', () => {
  it('generates high satisfaction for avg >= 4.0', () => {
    const survey = makeSurvey({
      questions: [
        makeQuestion({
          type: 'rating_scale',
          config: { max: 5 },
          answers: ratingAnswers([5, 4, 4, 5, 4]),
        }),
      ],
    });

    const results = generateInsightSuggestions([survey], new Set());

    expect(results).toHaveLength(1);
    expect(results[0]!.content).toContain('High satisfaction');
  });

  it('generates low satisfaction for avg <= 2.5', () => {
    const survey = makeSurvey({
      questions: [
        makeQuestion({
          type: 'rating_scale',
          config: { max: 5 },
          answers: ratingAnswers([1, 2, 3, 2, 2]),
        }),
      ],
    });

    const results = generateInsightSuggestions([survey], new Set());

    expect(results).toHaveLength(1);
    expect(results[0]!.content).toContain('Low satisfaction');
  });

  it('generates moderate satisfaction for middle avg', () => {
    const survey = makeSurvey({
      questions: [
        makeQuestion({
          type: 'rating_scale',
          config: { max: 5 },
          answers: ratingAnswers([3, 3, 3, 4, 3]),
        }),
      ],
    });

    const results = generateInsightSuggestions([survey], new Set());

    expect(results).toHaveLength(1);
    expect(results[0]!.content).toContain('Moderate satisfaction');
  });

  it('skips questions with no numeric ratings', () => {
    const survey = makeSurvey({
      questions: [
        makeQuestion({
          type: 'rating_scale',
          answers: [{ value: { rating: 'bad' } }],
        }),
      ],
    });

    const results = generateInsightSuggestions([survey], new Set());

    expect(results).toHaveLength(0);
  });
});

// ── multiple_choice suggestions ─────────────────────────────────────

describe('generateInsightSuggestions — multiple_choice', () => {
  it('generates clear preference when dominant option > 50%', () => {
    const survey = makeSurvey({
      questions: [
        makeQuestion({
          type: 'multiple_choice',
          answers: multipleChoiceAnswers([['A'], ['A'], ['A'], ['B'], ['C']]),
        }),
      ],
    });

    const results = generateInsightSuggestions([survey], new Set());

    expect(results).toHaveLength(1);
    expect(results[0]!.content).toContain('Clear preference');
    expect(results[0]!.content).toContain('60%');
    expect(results[0]!.content).toContain('"A"');
  });

  it('returns nothing when no dominant option', () => {
    const survey = makeSurvey({
      questions: [
        makeQuestion({
          type: 'multiple_choice',
          answers: multipleChoiceAnswers([['A'], ['B'], ['C'], ['D'], ['E']]),
        }),
      ],
    });

    const results = generateInsightSuggestions([survey], new Set());

    expect(results).toHaveLength(0);
  });

  it('skips answers with no selected array', () => {
    const survey = makeSurvey({
      questions: [
        makeQuestion({
          type: 'multiple_choice',
          answers: [{ value: { selected: undefined } }],
        }),
      ],
    });

    const results = generateInsightSuggestions([survey], new Set());

    expect(results).toHaveLength(0);
  });
});

// ── completion rate suggestions ─────────────────────────────────────

describe('generateInsightSuggestions — completion rate', () => {
  it('generates low engagement when completion rate <= 50%', () => {
    const survey = makeSurvey({
      totalResponses: 10,
      completedResponses: 4,
    });

    const results = generateInsightSuggestions([survey], new Set());

    expect(results).toHaveLength(1);
    expect(results[0]!.content).toContain('Low engagement');
    expect(results[0]!.content).toContain('40%');
  });

  it('returns nothing when completion rate > 50%', () => {
    const survey = makeSurvey({
      totalResponses: 10,
      completedResponses: 8,
    });

    const results = generateInsightSuggestions([survey], new Set());

    expect(results).toHaveLength(0);
  });

  it('returns nothing when there are no responses', () => {
    const survey = makeSurvey({
      totalResponses: 0,
      completedResponses: 0,
    });

    const results = generateInsightSuggestions([survey], new Set());

    expect(results).toHaveLength(0);
  });
});

// ── filtering and edge cases ────────────────────────────────────────

describe('generateInsightSuggestions — filtering', () => {
  it('filters out suggestions whose signatures are in actedSignatures', () => {
    const survey = makeSurvey({
      questions: [makeQuestion({ answers: yesNoAnswers(8, 10) })],
    });

    const all = generateInsightSuggestions([survey], new Set());

    expect(all).toHaveLength(1);

    const acted = new Set([all[0]!.signature]);
    const filtered = generateInsightSuggestions([survey], acted);

    expect(filtered).toHaveLength(0);
  });

  it('returns empty array for empty data', () => {
    expect(generateInsightSuggestions([], new Set())).toEqual([]);
  });

  it('includes source info with surveyTitle and questionText', () => {
    const survey = makeSurvey({
      surveyTitle: 'My Survey',
      questions: [
        makeQuestion({
          text: 'Is this useful?',
          answers: yesNoAnswers(9, 10),
        }),
      ],
    });

    const results = generateInsightSuggestions([survey], new Set());

    expect(results[0]!.source.surveyTitle).toBe('My Survey');
    expect(results[0]!.source.questionText).toBe('Is this useful?');
  });
});
