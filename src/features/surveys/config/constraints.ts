// ── Survey metadata constraints ─────────────────────────────────────

export const SURVEY_TITLE_MAX_LENGTH = 100;
export const SURVEY_DESCRIPTION_MAX_LENGTH = 2000;
export const SURVEY_MAX_RESPONDENTS_MIN = 1;

/** Maximum survey duration in days (from start date to end date). */
export const SURVEY_MAX_DURATION_DAYS = 30;

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

// ── Text question defaults ──────────────────────────────────────────

export const OPEN_TEXT_DEFAULT_MAX_LENGTH = 5000;
export const SHORT_TEXT_DEFAULT_MAX_LENGTH = 500;

/** Tolerance when validating that the start date is not in the past (ms). */
export const START_DATE_TOLERANCE_MS = 60_000;

/** Build the localStorage key for tracking completed survey responses. */
export const surveyCompletedKey = (slug: string) => `pps_completed_${slug}`;

/** Shared `Intl.DateTimeFormat` options used in survey detail/stats panels. */
export const DATE_FORMAT_SHORT = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
} as const;
