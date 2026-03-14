/**
 * Submission rate: % of respondents who started **and** completed the survey.
 * `completed / total * 100`, rounded to the nearest integer.
 */
export function calculateSubmissionRate(completed: number, total: number): number | null {
  return total > 0 ? Math.round((completed / total) * 100) : null;
}

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
