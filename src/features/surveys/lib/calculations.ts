export function calculateCompletionRate(completed: number, total: number): number | null {
  return total > 0 ? Math.round((completed / total) * 100) : null;
}

export function calculateRespondentProgress(
  completed: number,
  max: number | null | undefined
): number | null {
  return max != null && max > 0 ? Math.min(100, Math.round((completed / max) * 100)) : null;
}
