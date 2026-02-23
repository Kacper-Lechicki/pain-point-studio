/** Tests for the auto-signals generation engine. */
import { describe, expect, it } from 'vitest';

import type {
  QuestionSignalData,
  SurveySignalData,
} from '@/features/projects/actions/get-project-signals-data';
import { RESEARCH_PHASES, type ResearchPhase, type Signal } from '@/features/projects/types';

import { generateSignals } from './signals';

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
    researchPhase: 'problem_discovery',
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

// ── generateSignals ───────────────────────────────────────────────────

describe('generateSignals', () => {
  // ── Empty / no data ─────────────────────────────────────────────────

  it('generates "no_data" threat for each phase with no surveys', () => {
    const result = generateSignals([], RESEARCH_PHASES);

    for (const phase of RESEARCH_PHASES) {
      expect(result[phase]).toHaveLength(1);
      expect(result[phase]![0]).toMatchObject({
        type: 'threat',
        source: 'no_data',
        phase,
        value: 0,
      });
    }
  });

  it('generates "no_data" threat only for phases without surveys', () => {
    const result = generateSignals(
      [makeSurveyData({ researchPhase: 'problem_discovery', questions: [] })],
      RESEARCH_PHASES
    );

    expect(result['problem_discovery']).toHaveLength(0);
    expect(result['solution_validation']![0]!.source).toBe('no_data');
    expect(result['market_validation']![0]!.source).toBe('no_data');
    expect(result['launch_readiness']![0]!.source).toBe('no_data');
  });

  // ── Yes/No ──────────────────────────────────────────────────────────

  it('generates strength signal for yes/no > 70%', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          questions: [makeQuestion('yes_no', yesNoAnswers(8, 2))],
        }),
      ],
      RESEARCH_PHASES
    );

    const signals = result['problem_discovery']!;
    const yesSignal = signals.find((s: Signal) => s.source === 'yes_no');

    expect(yesSignal).toBeDefined();
    expect(yesSignal!.type).toBe('strength');
    expect(yesSignal!.value).toBe(0.8);
  });

  it('generates threat signal for yes/no < 40%', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          questions: [makeQuestion('yes_no', yesNoAnswers(3, 7))],
        }),
      ],
      RESEARCH_PHASES
    );

    const signals = result['problem_discovery']!;
    const yesSignal = signals.find((s: Signal) => s.source === 'yes_no');

    expect(yesSignal).toBeDefined();
    expect(yesSignal!.type).toBe('threat');
    expect(yesSignal!.value).toBe(0.3);
  });

  it('generates no signal for yes/no between 40-70%', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          questions: [makeQuestion('yes_no', yesNoAnswers(5, 5))],
        }),
      ],
      RESEARCH_PHASES
    );

    const signals = result['problem_discovery']!;
    const yesSignal = signals.find((s: Signal) => s.source === 'yes_no');

    expect(yesSignal).toBeUndefined();
  });

  it('generates strength signal at exactly 70% boundary', () => {
    // 7 yes out of 10 = exactly 0.7
    const result = generateSignals(
      [
        makeSurveyData({
          questions: [makeQuestion('yes_no', yesNoAnswers(7, 3))],
        }),
      ],
      RESEARCH_PHASES
    );

    const signal = result['problem_discovery']!.find((s: Signal) => s.source === 'yes_no');

    expect(signal!.type).toBe('strength');
  });

  it('generates threat signal at exactly 40% boundary', () => {
    // 4 yes out of 10 = exactly 0.4
    const result = generateSignals(
      [
        makeSurveyData({
          questions: [makeQuestion('yes_no', yesNoAnswers(4, 6))],
        }),
      ],
      RESEARCH_PHASES
    );

    const signal = result['problem_discovery']!.find((s: Signal) => s.source === 'yes_no');

    expect(signal!.type).toBe('threat');
  });

  it('skips yes/no questions with no boolean answers', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          questions: [makeQuestion('yes_no', [])],
        }),
      ],
      RESEARCH_PHASES
    );

    const signals = result['problem_discovery']!;

    expect(signals.find((s: Signal) => s.source === 'yes_no')).toBeUndefined();
  });

  // ── Rating ──────────────────────────────────────────────────────────

  it('generates strength signal for avg rating >= 4.0', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          questions: [makeQuestion('rating_scale', ratingAnswers([5, 4, 5, 4, 4]))],
        }),
      ],
      RESEARCH_PHASES
    );

    const signal = result['problem_discovery']!.find((s: Signal) => s.source === 'rating');

    expect(signal).toBeDefined();
    expect(signal!.type).toBe('strength');
    expect(signal!.value).toBeCloseTo(4.4);
    expect(signal!.detail).toBe('5');
  });

  it('generates threat signal for avg rating <= 2.5', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          questions: [makeQuestion('rating_scale', ratingAnswers([1, 2, 3, 2, 2]))],
        }),
      ],
      RESEARCH_PHASES
    );

    const signal = result['problem_discovery']!.find((s: Signal) => s.source === 'rating');

    expect(signal).toBeDefined();
    expect(signal!.type).toBe('threat');
    expect(signal!.value).toBe(2);
  });

  it('generates no signal for avg rating between 2.5 and 4.0', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          questions: [makeQuestion('rating_scale', ratingAnswers([3, 3, 3, 4, 3]))],
        }),
      ],
      RESEARCH_PHASES
    );

    const signal = result['problem_discovery']!.find((s: Signal) => s.source === 'rating');

    expect(signal).toBeUndefined();
  });

  it('generates strength at exactly 4.0 boundary', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          questions: [makeQuestion('rating_scale', ratingAnswers([4, 4, 4, 4, 4]))],
        }),
      ],
      RESEARCH_PHASES
    );

    const signal = result['problem_discovery']!.find((s: Signal) => s.source === 'rating');

    expect(signal!.type).toBe('strength');
  });

  it('generates threat at exactly 2.5 boundary', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          questions: [makeQuestion('rating_scale', ratingAnswers([2, 3, 2, 3, 2, 3]))],
        }),
      ],
      RESEARCH_PHASES
    );

    const signal = result['problem_discovery']!.find((s: Signal) => s.source === 'rating');

    expect(signal!.type).toBe('threat');
  });

  it('skips rating questions with no numeric answers', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          questions: [makeQuestion('rating_scale', [])],
        }),
      ],
      RESEARCH_PHASES
    );

    expect(result['problem_discovery']!.find((s: Signal) => s.source === 'rating')).toBeUndefined();
  });

  it('uses config.max for rating detail', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          questions: [
            makeQuestion('rating_scale', ratingAnswers([9, 10, 9, 10, 10]), {
              config: { min: 1, max: 10 },
            }),
          ],
        }),
      ],
      RESEARCH_PHASES
    );

    const signal = result['problem_discovery']!.find((s: Signal) => s.source === 'rating');

    expect(signal!.detail).toBe('10');
  });

  // ── Multiple Choice ─────────────────────────────────────────────────

  it('generates signal for MC dominant option > 50%', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          questions: [
            makeQuestion('multiple_choice', mcAnswers([['A'], ['A'], ['A'], ['B'], ['C']])),
          ],
        }),
      ],
      RESEARCH_PHASES
    );

    const signal = result['problem_discovery']!.find((s: Signal) => s.source === 'multiple_choice');

    expect(signal).toBeDefined();
    expect(signal!.type).toBe('signal');
    expect(signal!.value).toBe(0.6);
    expect(signal!.detail).toBe('A');
  });

  it('generates no signal when no option exceeds 50%', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          questions: [
            makeQuestion(
              'multiple_choice',
              mcAnswers([['A'], ['B'], ['C'], ['A'], ['B'], ['C'], ['A'], ['B'], ['C'], ['D']])
            ),
          ],
        }),
      ],
      RESEARCH_PHASES
    );

    const signal = result['problem_discovery']!.find((s: Signal) => s.source === 'multiple_choice');

    expect(signal).toBeUndefined();
  });

  it('handles multi-select MC answers (counts respondents, not selections)', () => {
    // 3 respondents; 2 picked 'A' (out of 3 respondents = 66%)
    const result = generateSignals(
      [
        makeSurveyData({
          questions: [makeQuestion('multiple_choice', mcAnswers([['A', 'B'], ['A', 'C'], ['B']]))],
        }),
      ],
      RESEARCH_PHASES
    );

    const signal = result['problem_discovery']!.find((s: Signal) => s.source === 'multiple_choice');

    expect(signal).toBeDefined();
    expect(signal!.detail).toBe('A');
    // 2 out of 3 respondents picked A
    expect(signal!.value).toBeCloseTo(2 / 3);
  });

  it('skips MC questions with no selected answers', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          questions: [makeQuestion('multiple_choice', [])],
        }),
      ],
      RESEARCH_PHASES
    );

    expect(
      result['problem_discovery']!.find((s: Signal) => s.source === 'multiple_choice')
    ).toBeUndefined();
  });

  // ── Completion rate ─────────────────────────────────────────────────

  it('generates threat for completion rate < 50%', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          totalResponses: 10,
          completedResponses: 4,
          questions: [],
        }),
      ],
      RESEARCH_PHASES
    );

    const signal = result['problem_discovery']!.find((s: Signal) => s.source === 'completion_rate');

    expect(signal).toBeDefined();
    expect(signal!.type).toBe('threat');
    expect(signal!.value).toBe(0.4);
  });

  it('generates no signal for completion rate >= 50%', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          totalResponses: 10,
          completedResponses: 6,
          questions: [],
        }),
      ],
      RESEARCH_PHASES
    );

    const signal = result['problem_discovery']!.find((s: Signal) => s.source === 'completion_rate');

    expect(signal).toBeUndefined();
  });

  it('generates threat at exactly 50% completion boundary', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          totalResponses: 10,
          completedResponses: 5,
          questions: [],
        }),
      ],
      RESEARCH_PHASES
    );

    const signal = result['problem_discovery']!.find((s: Signal) => s.source === 'completion_rate');

    expect(signal).toBeDefined();
    expect(signal!.type).toBe('threat');
  });

  it('skips completion rate when totalResponses is 0', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          totalResponses: 0,
          completedResponses: 0,
          questions: [],
        }),
      ],
      RESEARCH_PHASES
    );

    const signal = result['problem_discovery']!.find((s: Signal) => s.source === 'completion_rate');

    expect(signal).toBeUndefined();
  });

  // ── Ignored question types ──────────────────────────────────────────

  it('ignores open_text questions', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          questions: [makeQuestion('open_text', [{ value: { text: 'some feedback' } }])],
        }),
      ],
      RESEARCH_PHASES
    );

    const signals = result['problem_discovery']!.filter(
      (s: Signal) => s.source !== 'no_data' && s.source !== 'completion_rate'
    );

    expect(signals).toHaveLength(0);
  });

  it('ignores short_text questions', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          questions: [makeQuestion('short_text', [{ value: { text: 'short answer' } }])],
        }),
      ],
      RESEARCH_PHASES
    );

    const signals = result['problem_discovery']!.filter(
      (s: Signal) => s.source !== 'no_data' && s.source !== 'completion_rate'
    );

    expect(signals).toHaveLength(0);
  });

  // ── Mixed / integration scenarios ───────────────────────────────────

  it('generates signals from multiple question types in one survey', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          questions: [
            makeQuestion('yes_no', yesNoAnswers(8, 2)),
            makeQuestion('rating_scale', ratingAnswers([1, 2, 2, 1, 2])),
            makeQuestion('multiple_choice', mcAnswers([['A'], ['A'], ['A'], ['B']])),
          ],
        }),
      ],
      RESEARCH_PHASES
    );

    const signals = result['problem_discovery']!;

    expect(
      signals.find((s: Signal) => s.source === 'yes_no' && s.type === 'strength')
    ).toBeDefined();
    expect(signals.find((s: Signal) => s.source === 'rating' && s.type === 'threat')).toBeDefined();
    expect(
      signals.find((s: Signal) => s.source === 'multiple_choice' && s.type === 'signal')
    ).toBeDefined();
  });

  it('generates signals from multiple surveys in one phase', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          surveyTitle: 'Survey A',
          researchPhase: 'problem_discovery',
          questions: [makeQuestion('yes_no', yesNoAnswers(9, 1))],
        }),
        makeSurveyData({
          surveyTitle: 'Survey B',
          researchPhase: 'problem_discovery',
          questions: [makeQuestion('yes_no', yesNoAnswers(2, 8))],
        }),
      ],
      RESEARCH_PHASES
    );

    const signals = result['problem_discovery']!.filter((s: Signal) => s.source === 'yes_no');

    expect(signals).toHaveLength(2);
    expect(signals.find((s: Signal) => s.type === 'strength')).toBeDefined();
    expect(signals.find((s: Signal) => s.type === 'threat')).toBeDefined();
  });

  it('correctly routes signals to their respective phases', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          researchPhase: 'problem_discovery',
          questions: [makeQuestion('yes_no', yesNoAnswers(9, 1))],
        }),
        makeSurveyData({
          researchPhase: 'solution_validation',
          questions: [makeQuestion('yes_no', yesNoAnswers(2, 8))],
        }),
      ],
      RESEARCH_PHASES
    );

    expect(result['problem_discovery']!.find((s: Signal) => s.source === 'yes_no')!.type).toBe(
      'strength'
    );
    expect(result['solution_validation']!.find((s: Signal) => s.source === 'yes_no')!.type).toBe(
      'threat'
    );
  });

  it('includes questionText and surveyTitle in signals', () => {
    const result = generateSignals(
      [
        makeSurveyData({
          surveyTitle: 'My Important Survey',
          questions: [
            makeQuestion('yes_no', yesNoAnswers(9, 1), { text: 'Do you experience this problem?' }),
          ],
        }),
      ],
      RESEARCH_PHASES
    );

    const signal = result['problem_discovery']!.find((s: Signal) => s.source === 'yes_no')!;

    expect(signal.questionText).toBe('Do you experience this problem?');
    expect(signal.surveyTitle).toBe('My Important Survey');
  });

  it('handles empty phases list', () => {
    const result = generateSignals(
      [makeSurveyData({ questions: [makeQuestion('yes_no', yesNoAnswers(9, 1))] })],
      [] as unknown as readonly ResearchPhase[]
    );

    expect(Object.keys(result)).toHaveLength(0);
  });
});
