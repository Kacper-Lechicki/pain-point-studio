import { SYNC_ELAPSED_TICK_MS } from '@/features/surveys/config';

/** Any function that accepts a translation key + optional params and returns a string. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Translator = (...args: any[]) => string;

/**
 * Formats a millisecond duration into a human-readable "time ago" string.
 *
 * Uses `SYNC_ELAPSED_TICK_MS` as the "just now" threshold so the label
 * stays in sync with the tick interval of the refresh button.
 *
 * @param ms   - elapsed time in milliseconds
 * @param t    - translator scoped to `common.sync`
 */
export function formatElapsed(ms: number, t: Translator): string {
  const seconds = Math.floor(ms / 1000);

  if (seconds < SYNC_ELAPSED_TICK_MS / 1000) {
    return t('justNow');
  }

  if (seconds < 60) {
    return t('secondsAgo', { seconds });
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return t('minutesAgo', { minutes });
  }

  const hours = Math.floor(minutes / 60);

  return t('hoursAgo', { hours });
}
