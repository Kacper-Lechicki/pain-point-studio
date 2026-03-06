import type {
  QuestionSignalData,
  SurveySignalData,
} from '@/features/projects/actions/get-project-signals-data';
import { FINDING_THRESHOLDS } from '@/features/projects/config/signals';
import type { InsightSuggestion } from '@/features/projects/types';

// ── Signature builders ─────────────────────────────────────────────

function questionSignature(surveyId: string, questionId: string, source: string): string {
  return `${surveyId}:${questionId}:${source}`;
}

function surveySignature(surveyId: string, source: string): string {
  return `survey:${surveyId}:${source}`;
}

// ── Helpers ─────────────────────────────────────────────────────────

function make(
  signature: string,
  content: string,
  surveyTitle: string,
  questionText?: string
): InsightSuggestion {
  const source: InsightSuggestion['source'] = { surveyTitle };

  if (questionText !== undefined) {
    source.questionText = questionText;
  }

  return { signature, content, source };
}

// ── Per-question suggestion generators ─────────────────────────────

function suggestYesNo(
  surveyId: string,
  q: QuestionSignalData,
  surveyTitle: string
): InsightSuggestion | null {
  const answers = q.answers.filter((a) => typeof a.value.answer === 'boolean');

  if (answers.length === 0) {return null;}

  const yesCount = answers.filter((a) => a.value.answer === true).length;
  const fraction = yesCount / answers.length;
  const pct = Math.round(fraction * 100);
  const sig = questionSignature(surveyId, q.id, 'yes_no');

  if (fraction >= FINDING_THRESHOLDS.yesNo.highMin) {
    return make(sig, `Strong validation: ${pct}% confirmed "${q.text}"`, surveyTitle, q.text);
  }

  if (fraction <= FINDING_THRESHOLDS.yesNo.lowMax) {
    return make(sig, `Weak validation: only ${pct}% agreed with "${q.text}"`, surveyTitle, q.text);
  }

  // Middle range
  return make(
    sig,
    `Mixed signal: ${pct}% agreed with "${q.text}" — worth exploring`,
    surveyTitle,
    q.text
  );
}

function suggestRating(
  surveyId: string,
  q: QuestionSignalData,
  surveyTitle: string
): InsightSuggestion | null {
  const ratings: number[] = [];

  for (const a of q.answers) {
    const r = a.value.rating;

    if (typeof r === 'number') {ratings.push(r);}
  }

  if (ratings.length === 0) {return null;}

  const avg = ratings.reduce((s, v) => s + v, 0) / ratings.length;
  const max = (q.config.max as number) ?? 5;
  const avgStr = avg.toFixed(1);
  const sig = questionSignature(surveyId, q.id, 'rating');

  if (avg >= FINDING_THRESHOLDS.rating.highMin) {
    return make(sig, `High satisfaction (${avgStr}/${max}) for "${q.text}"`, surveyTitle, q.text);
  }

  if (avg <= FINDING_THRESHOLDS.rating.lowMax) {
    return make(sig, `Low satisfaction (${avgStr}/${max}) for "${q.text}"`, surveyTitle, q.text);
  }

  // Middle range
  return make(sig, `Moderate satisfaction (${avgStr}/${max}) for "${q.text}"`, surveyTitle, q.text);
}

function suggestMultipleChoice(
  surveyId: string,
  q: QuestionSignalData,
  surveyTitle: string
): InsightSuggestion | null {
  const counts = new Map<string, number>();
  let respondentCount = 0;

  for (const a of q.answers) {
    const selected = a.value.selected as string[] | undefined;

    if (!Array.isArray(selected) || selected.length === 0) {continue;}

    respondentCount++;

    for (const opt of selected) {counts.set(opt, (counts.get(opt) ?? 0) + 1);}
  }

  if (respondentCount === 0) {return null;}

  let dominantOption = '';
  let dominantCount = 0;

  for (const [opt, count] of counts) {
    if (count > dominantCount) {
      dominantCount = count;
      dominantOption = opt;
    }
  }

  const fraction = dominantCount / respondentCount;

  if (fraction < FINDING_THRESHOLDS.multipleChoice.dominantMin) {return null;}

  const pct = Math.round(fraction * 100);

  return make(
    questionSignature(surveyId, q.id, 'multiple_choice'),
    `Clear preference: ${pct}% chose "${dominantOption}" for "${q.text}"`,
    surveyTitle,
    q.text
  );
}

function suggestCompletionRate(survey: SurveySignalData): InsightSuggestion | null {
  if (survey.totalResponses === 0) {return null;}

  const rate = survey.completedResponses / survey.totalResponses;

  if (rate > FINDING_THRESHOLDS.completionRate.lowMax) {return null;}

  const pct = Math.round(rate * 100);

  return make(
    surveySignature(survey.surveyId, 'completion_rate'),
    `Low engagement: only ${pct}% completed "${survey.surveyTitle}"`,
    survey.surveyTitle
  );
}

// ── Main entry point ───────────────────────────────────────────────

/**
 * Generate insight suggestions from survey response data.
 *
 * Unlike `generateFindings()`, this covers ALL value ranges (including
 * middle ranges) so users see the full picture. Suggestions are neutral
 * (no SWOT type pre-assigned) — the user picks the category.
 *
 * @param surveysData  Raw per-question answer data for all surveys.
 * @param actedSignatures  Signatures the user already accepted or dismissed.
 * @returns Filtered array of suggestions (only those not yet acted on).
 */
export function generateInsightSuggestions(
  surveysData: SurveySignalData[],
  actedSignatures: Set<string>
): InsightSuggestion[] {
  const suggestions: InsightSuggestion[] = [];

  for (const survey of surveysData) {
    for (const question of survey.questions) {
      let suggestion: InsightSuggestion | null = null;

      switch (question.type) {
        case 'yes_no':
          suggestion = suggestYesNo(survey.surveyId, question, survey.surveyTitle);
          break;
        case 'rating_scale':
          suggestion = suggestRating(survey.surveyId, question, survey.surveyTitle);
          break;
        case 'multiple_choice':
          suggestion = suggestMultipleChoice(survey.surveyId, question, survey.surveyTitle);
          break;
        // open_text, short_text — skip (no quantitative data)
      }

      if (suggestion && !actedSignatures.has(suggestion.signature)) {
        suggestions.push(suggestion);
      }
    }

    // Survey-level: completion rate
    const completionSuggestion = suggestCompletionRate(survey);

    if (completionSuggestion && !actedSignatures.has(completionSuggestion.signature)) {
      suggestions.push(completionSuggestion);
    }
  }

  return suggestions;
}
