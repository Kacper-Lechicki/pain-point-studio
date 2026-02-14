export function calculateCompletionRate(completed: number, total: number): number | null {
  return total > 0 ? Math.round((completed / total) * 100) : null;
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
 * @param limitDays - Number of days after `timestampAt` before expiry (e.g. 30)
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
