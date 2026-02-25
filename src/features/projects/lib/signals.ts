import type {
  QuestionSignalData,
  SurveySignalData,
} from '@/features/projects/actions/get-project-signals-data';
import { FINDING_THRESHOLDS } from '@/features/projects/config/signals';
import type { Finding, FindingSource, ResearchPhase } from '@/features/projects/types';

// ── Helpers ────────────────────────────────────────────────────────────

function makeFinding(
  source: FindingSource,
  phase: ResearchPhase | null,
  value: number,
  opts?: Pick<Finding, 'questionText' | 'surveyTitle' | 'detail'>
): Finding {
  return { source, phase, value, ...opts };
}

// ── Per-question analysers ─────────────────────────────────────────────

function analyseYesNo(
  q: QuestionSignalData,
  phase: ResearchPhase | null,
  surveyTitle: string
): Finding | null {
  const answers = q.answers.filter((a) => typeof a.value.answer === 'boolean');

  if (answers.length === 0) {
    return null;
  }

  const yesCount = answers.filter((a) => a.value.answer === true).length;
  const fraction = yesCount / answers.length;

  if (fraction >= FINDING_THRESHOLDS.yesNo.highMin || fraction <= FINDING_THRESHOLDS.yesNo.lowMax) {
    return makeFinding('yes_no', phase, fraction, {
      questionText: q.text,
      surveyTitle,
    });
  }

  return null;
}

function analyseRating(
  q: QuestionSignalData,
  phase: ResearchPhase | null,
  surveyTitle: string
): Finding | null {
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
    return makeFinding('rating', phase, avg, {
      questionText: q.text,
      surveyTitle,
      detail: String(max),
    });
  }

  return null;
}

function analyseMultipleChoice(
  q: QuestionSignalData,
  phase: ResearchPhase | null,
  surveyTitle: string
): Finding | null {
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
    return makeFinding('multiple_choice', phase, fraction, {
      questionText: q.text,
      surveyTitle,
      detail: dominantOption,
    });
  }

  return null;
}

// ── Survey-level analysis ──────────────────────────────────────────────

function analyseCompletionRate(
  survey: SurveySignalData,
  phase: ResearchPhase | null
): Finding | null {
  if (survey.totalResponses === 0) {
    return null;
  }

  const rate = survey.completedResponses / survey.totalResponses;

  if (rate <= FINDING_THRESHOLDS.completionRate.lowMax) {
    return makeFinding('completion_rate', phase, rate, {
      surveyTitle: survey.surveyTitle,
    });
  }

  return null;
}

// ── Main entry point ───────────────────────────────────────────────────

/**
 * Generate auto-findings from survey response data, grouped by phase.
 *
 * Findings are neutral observations — they carry no positive/negative
 * interpretation.  Users categorise them manually as insights.
 *
 * @param surveysData - Raw per-question answer data for all surveys in a project.
 * @param phases      - Research phases to check.
 * @returns Record keyed by phase value → Finding[].
 */
export function generateFindings(
  surveysData: SurveySignalData[],
  phases: readonly ResearchPhase[]
): Record<string, Finding[]> {
  const result: Record<string, Finding[]> = {};

  // Group surveys by phase
  const surveysByPhase = new Map<string, SurveySignalData[]>();

  for (const survey of surveysData) {
    const key = survey.researchPhase ?? 'unassigned';

    if (!surveysByPhase.has(key)) {
      surveysByPhase.set(key, []);
    }

    surveysByPhase.get(key)!.push(survey);
  }

  // Analyse each phase
  for (const phase of phases) {
    const phaseFindings: Finding[] = [];
    const phaseSurveys = surveysByPhase.get(phase) ?? [];

    if (phaseSurveys.length === 0) {
      result[phase] = phaseFindings;
      continue;
    }

    for (const survey of phaseSurveys) {
      // Per-question findings
      for (const question of survey.questions) {
        let finding: Finding | null = null;

        switch (question.type) {
          case 'yes_no':
            finding = analyseYesNo(question, phase, survey.surveyTitle);
            break;
          case 'rating_scale':
            finding = analyseRating(question, phase, survey.surveyTitle);
            break;
          case 'multiple_choice':
            finding = analyseMultipleChoice(question, phase, survey.surveyTitle);
            break;
          // open_text, short_text — skip (no quantitative data)
        }

        if (finding) {
          phaseFindings.push(finding);
        }
      }

      // Survey-level: completion rate
      const completionFinding = analyseCompletionRate(survey, phase);

      if (completionFinding) {
        phaseFindings.push(completionFinding);
      }
    }

    result[phase] = phaseFindings;
  }

  return result;
}
