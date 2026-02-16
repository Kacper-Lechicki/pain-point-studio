// ── Survey metadata constraints ─────────────────────────────────────

export const SURVEY_TITLE_MAX_LENGTH = 100;
export const SURVEY_DESCRIPTION_MAX_LENGTH = 2000;
export const SURVEY_MAX_RESPONDENTS_MIN = 1;

/** Retention period in days for archived/cancelled/completed surveys before permanent deletion. */
export const SURVEY_RETENTION_DAYS = 14;

// ── Question builder constraints ────────────────────────────────────

export const QUESTIONS_MIN = 1;
export const QUESTIONS_MAX = 15;
export const QUESTION_TEXT_MAX_LENGTH = 500;
export const QUESTION_DESCRIPTION_MAX_LENGTH = 500;
export const QUESTION_OPTIONS_MIN = 2;
export const QUESTION_OPTIONS_MAX = 10;
export const QUESTION_OPTION_MAX_LENGTH = 200;
export const RATING_SCALE_MIN = 1;
export const RATING_SCALE_MAX = 10;

/** Estimated seconds per question (used to calculate survey completion time). */
export const ESTIMATED_SECONDS_PER_QUESTION = 30;

// ── Selection constraints ───────────────────────────────────────────

export const SELECTION_MIN = 1;

// ── Text question constraints ──────────────────────────────────────

export const OPEN_TEXT_DEFAULT_MAX_LENGTH = 5000;
export const SHORT_TEXT_DEFAULT_MAX_LENGTH = 500;
export const TEXT_MAX_LENGTH_MIN = 1;
export const TEXT_MAX_LENGTH_MAX = 10_000;
export const TEXT_PLACEHOLDER_MAX_LENGTH = 200;
export const RATING_LABEL_MAX_LENGTH = 100;

/** Tolerance when validating that the start date is not in the past (ms). */
export const START_DATE_TOLERANCE_MS = 60_000;

// ── UI timing ──────────────────────────────────────────────────────

/** Interval (ms) for `useNow()` calls that update relative timestamps. */
export const NOW_UPDATE_INTERVAL_MS = 60_000;

/** Debounce (ms) for realtime subscription refreshes on the survey list. */
export const REALTIME_DEBOUNCE_MS = 1_500;

// ── Threshold constants ────────────────────────────────────────────

/** % of respondent cap at which a warning is shown (0–1). */
export const RESPONDENT_LIMIT_WARNING_THRESHOLD = 0.8;

/** Days before end-date at which a "ending soon" hint is shown. */
export const SURVEY_ENDING_SOON_DAYS = 3;

// ── Text search / keyword extraction ──────────────────────────────

export const TEXT_SEARCH_MAX_KEYWORDS = 10;
export const TEXT_SEARCH_MIN_WORD_LENGTH = 3;
export const TEXT_SEARCH_INITIAL_VISIBLE = 5;
export const TEXT_SEARCH_MAX_VISIBLE = 10;

// ── Rating chart thresholds ──────────────────────────────────────

export const RATING_THRESHOLDS = {
  sentiment: { excellent: 0.8, good: 0.6, fair: 0.4 },
  color: { good: 0.7, fair: 0.4 },
  bar: { low: 0.33, mid: 0.66 },
} as const;

/** Change ratio below which a sparkline trend is considered "sharply declining". */
export const SPARKLINE_SHARPLY_DECLINING_THRESHOLD = -0.4;

// ── Misc helpers ──────────────────────────────────────────────────

/** Build the localStorage key for tracking completed survey responses. */
export const surveyCompletedKey = (slug: string) => `pps_completed_${slug}`;

/** Shared `Intl.DateTimeFormat` options used in survey detail/stats panels. */
export const DATE_FORMAT_SHORT = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
} as const;
