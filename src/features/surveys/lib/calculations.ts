/**
 * Submission rate: % of respondents who started **and** completed the survey.
 * `completed / total * 100`, rounded to the nearest integer.
 */
export function calculateSubmissionRate(completed: number, total: number): number | null {
  return total > 0 ? Math.round((completed / total) * 100) : null;
}

/** @deprecated Use `calculateSubmissionRate` instead. */
export const calculateCompletionRate = calculateSubmissionRate;

/**
 * Average question completion: across all completed responses, what % of
 * questions were actually answered on average?
 *
 * Calculated as: `totalAnswersGiven / (completedResponses × totalQuestions) × 100`
 *
 * @param answersPerQuestion - Array with the number of answers for each question
 *                             (i.e. `question.answers.length` for each question)
 * @param completedResponses - Number of completed survey responses
 */
export function calculateAvgQuestionCompletion(
  answersPerQuestion: number[],
  completedResponses: number
): number | null {
  const totalQuestions = answersPerQuestion.length;

  if (totalQuestions === 0 || completedResponses === 0) {
    return null;
  }

  const totalAnswers = answersPerQuestion.reduce((sum, count) => sum + count, 0);
  const possible = completedResponses * totalQuestions;

  return Math.round((totalAnswers / possible) * 100);
}

export function calculateRespondentProgress(
  completed: number,
  max: number | null | undefined
): number | null {
  return max != null && max > 0 ? Math.min(100, Math.round((completed / max) * 100)) : null;
}

/**
 * Calculates the number of days until a timestamped item expires.
 * Returns null if the timestamp is missing, or if the item has already expired.
 *
 * @param timestampAt - ISO timestamp when the countdown started (e.g. `archived_at`, `cancelled_at`)
 * @param limitDays - Number of days after `timestampAt` before expiry (e.g. 14)
 */
export function daysUntilExpiry(
  timestampAt: string | null | undefined,
  limitDays: number
): number | null {
  if (!timestampAt) {
    return null;
  }

  const expiresAt = new Date(timestampAt).getTime() + limitDays * 24 * 60 * 60 * 1000;
  const remaining = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));

  return remaining > 0 ? remaining : null;
}

/**
 * Formats a duration in seconds into a human-readable string like "2m 30s".
 * Returns null for missing or non-positive values.
 */
export function formatCompletionTime(seconds: number | null | undefined): string | null {
  if (seconds == null || seconds <= 0) {
    return null;
  }

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  if (m === 0) {
    return `${s}s`;
  }

  return `${m}m ${s}s`;
}
