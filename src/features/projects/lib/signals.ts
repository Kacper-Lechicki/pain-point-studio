import type {
  QuestionSignalData,
  SurveySignalData,
} from '@/features/projects/actions/get-project-signals-data';
import { FINDING_THRESHOLDS } from '@/features/projects/config/signals';
import type { Finding, FindingSource } from '@/features/projects/types';

// ── Helpers ────────────────────────────────────────────────────────────

function makeFinding(
  source: FindingSource,
  value: number,
  opts?: Pick<Finding, 'questionText' | 'surveyTitle' | 'detail'>
): Finding {
  return { source, value, ...opts };
}

// ── Per-question analysers ─────────────────────────────────────────────

function analyseYesNo(q: QuestionSignalData, surveyTitle: string): Finding | null {
  const answers = q.answers.filter((a) => typeof a.value.answer === 'boolean');

  if (answers.length === 0) {
    return null;
  }

  const yesCount = answers.filter((a) => a.value.answer === true).length;
  const fraction = yesCount / answers.length;

  if (fraction >= FINDING_THRESHOLDS.yesNo.highMin || fraction <= FINDING_THRESHOLDS.yesNo.lowMax) {
    return makeFinding('yes_no', fraction, {
      questionText: q.text,
      surveyTitle,
    });
  }

  return null;
}

function analyseRating(q: QuestionSignalData, surveyTitle: string): Finding | null {
  const ratings: number[] = [];

  for (const a of q.answers) {
    const r = a.value.rating;

    if (typeof r === 'number') {
      ratings.push(r);
    }
  }

  if (ratings.length === 0) {
    return null;
  }

  const avg = ratings.reduce((s, v) => s + v, 0) / ratings.length;
  const max = (q.config.max as number) ?? 5;

  if (avg >= FINDING_THRESHOLDS.rating.highMin || avg <= FINDING_THRESHOLDS.rating.lowMax) {
    return makeFinding('rating', avg, {
      questionText: q.text,
      surveyTitle,
      detail: String(max),
    });
  }

  return null;
}

function analyseMultipleChoice(q: QuestionSignalData, surveyTitle: string): Finding | null {
  const counts = new Map<string, number>();
  let respondentCount = 0;

  for (const a of q.answers) {
    const selected = a.value.selected as string[] | undefined;

    if (!Array.isArray(selected) || selected.length === 0) {
      continue;
    }

    respondentCount++;

    for (const opt of selected) {
      counts.set(opt, (counts.get(opt) ?? 0) + 1);
    }
  }

  if (respondentCount === 0) {
    return null;
  }

  let dominantOption = '';
  let dominantCount = 0;

  for (const [opt, count] of counts) {
    if (count > dominantCount) {
      dominantCount = count;
      dominantOption = opt;
    }
  }

  const fraction = dominantCount / respondentCount;

  if (fraction >= FINDING_THRESHOLDS.multipleChoice.dominantMin) {
    return makeFinding('multiple_choice', fraction, {
      questionText: q.text,
      surveyTitle,
      detail: dominantOption,
    });
  }

  return null;
}

// ── Survey-level analysis ──────────────────────────────────────────────

function analyseCompletionRate(survey: SurveySignalData): Finding | null {
  if (survey.totalResponses === 0) {
    return null;
  }

  const rate = survey.completedResponses / survey.totalResponses;

  if (rate <= FINDING_THRESHOLDS.completionRate.lowMax) {
    return makeFinding('completion_rate', rate, {
      surveyTitle: survey.surveyTitle,
    });
  }

  return null;
}

// ── Main entry point ───────────────────────────────────────────────────

/**
 * Generate auto-findings from survey response data.
 *
 * Findings are neutral observations — they carry no positive/negative
 * interpretation.  Users categorise them manually as insights.
 *
 * @param surveysData - Raw per-question answer data for all surveys in a project.
 * @returns Flat array of findings across all surveys.
 */
export function generateFindings(surveysData: SurveySignalData[]): Finding[] {
  const findings: Finding[] = [];

  for (const survey of surveysData) {
    // Per-question findings
    for (const question of survey.questions) {
      let finding: Finding | null = null;

      switch (question.type) {
        case 'yes_no':
          finding = analyseYesNo(question, survey.surveyTitle);
          break;
        case 'rating_scale':
          finding = analyseRating(question, survey.surveyTitle);
          break;
        case 'multiple_choice':
          finding = analyseMultipleChoice(question, survey.surveyTitle);
          break;
        // open_text, short_text — skip (no quantitative data)
      }

      if (finding) {
        findings.push(finding);
      }
    }

    // Survey-level: completion rate
    const completionFinding = analyseCompletionRate(survey);

    if (completionFinding) {
      findings.push(completionFinding);
    }
  }

  return findings;
}
