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
