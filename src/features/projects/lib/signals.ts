import type {
  QuestionSignalData,
  SurveySignalData,
} from '@/features/projects/actions/get-project-signals-data';
import { SIGNAL_THRESHOLDS } from '@/features/projects/config/signals';
import type { ResearchPhase, Signal, SignalType } from '@/features/projects/types';

// ── Helpers ────────────────────────────────────────────────────────────

// function pct(n: number): number {
//   return Math.round(n * 100);
// }

function makeSignal(
  type: SignalType,
  source: Signal['source'],
  phase: ResearchPhase | null,
  value: number,
  opts?: Pick<Signal, 'questionText' | 'surveyTitle' | 'detail'>
): Signal {
  return { type, source, phase, value, ...opts };
}

// ── Per-question analysers ─────────────────────────────────────────────

function analyseYesNo(
  q: QuestionSignalData,
  phase: ResearchPhase | null,
  surveyTitle: string
): Signal | null {
  const answers = q.answers.filter((a) => typeof a.value.answer === 'boolean');

  if (answers.length === 0) {
    return null;
  }

  const yesCount = answers.filter((a) => a.value.answer === true).length;
  const fraction = yesCount / answers.length;

  if (fraction >= SIGNAL_THRESHOLDS.yesNo.strengthMin) {
    return makeSignal('strength', 'yes_no', phase, fraction, {
      questionText: q.text,
      surveyTitle,
    });
  }

  if (fraction <= SIGNAL_THRESHOLDS.yesNo.threatMax) {
    return makeSignal('threat', 'yes_no', phase, fraction, {
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
): Signal | null {
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

  if (avg >= SIGNAL_THRESHOLDS.rating.strengthMin) {
    return makeSignal('strength', 'rating', phase, avg, {
      questionText: q.text,
      surveyTitle,
      detail: String(max),
    });
  }

  if (avg <= SIGNAL_THRESHOLDS.rating.threatMax) {
    return makeSignal('threat', 'rating', phase, avg, {
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
): Signal | null {
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

  if (fraction >= SIGNAL_THRESHOLDS.multipleChoice.dominantMin) {
    return makeSignal('signal', 'multiple_choice', phase, fraction, {
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
): Signal | null {
  if (survey.totalResponses === 0) {
    return null;
  }

  const rate = survey.completedResponses / survey.totalResponses;

  if (rate <= SIGNAL_THRESHOLDS.completionRate.threatMax) {
    return makeSignal('threat', 'completion_rate', phase, rate, {
      surveyTitle: survey.surveyTitle,
    });
  }

  return null;
}

// ── Main entry point ───────────────────────────────────────────────────

/**
 * Generate auto-signals from survey response data, grouped by phase.
 *
 * @param surveysData - Raw per-question answer data for all surveys in a project.
 * @param phases      - Research phases to check (empty phases produce a "no data" threat).
 * @returns Record keyed by phase value (or `'project'`) → Signal[].
 */
export function generateSignals(
  surveysData: SurveySignalData[],
  phases: readonly ResearchPhase[]
): Record<string, Signal[]> {
  const result: Record<string, Signal[]> = {};

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
    const phaseSignals: Signal[] = [];
    const phaseSurveys = surveysByPhase.get(phase) ?? [];

    if (phaseSurveys.length === 0) {
      phaseSignals.push(makeSignal('threat', 'no_data', phase, 0));
      result[phase] = phaseSignals;
      continue;
    }

    for (const survey of phaseSurveys) {
      // Per-question signals
      for (const question of survey.questions) {
        let signal: Signal | null = null;

        switch (question.type) {
          case 'yes_no':
            signal = analyseYesNo(question, phase, survey.surveyTitle);
            break;
          case 'rating_scale':
            signal = analyseRating(question, phase, survey.surveyTitle);
            break;
          case 'multiple_choice':
            signal = analyseMultipleChoice(question, phase, survey.surveyTitle);
            break;
          // open_text, short_text — skip (no quantitative data)
        }

        if (signal) {
          phaseSignals.push(signal);
        }
      }

      // Survey-level: completion rate
      const completionSignal = analyseCompletionRate(survey, phase);

      if (completionSignal) {
        phaseSignals.push(completionSignal);
      }
    }

    result[phase] = phaseSignals;
  }

  return result;
}
