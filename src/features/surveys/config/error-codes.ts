// ── Supabase RPC error identifiers ──────────────────────────────────
// These strings match RAISE EXCEPTION values in PostgreSQL functions.

const RPC_ERROR = {
  // start_survey_response
  SURVEY_NOT_FOUND: 'SURVEY_NOT_FOUND',
  SURVEY_NOT_ACTIVE: 'SURVEY_NOT_ACTIVE',
  SURVEY_NOT_STARTED: 'SURVEY_NOT_STARTED',
  SURVEY_EXPIRED: 'SURVEY_EXPIRED',
  MAX_RESPONDENTS_REACHED: 'MAX_RESPONDENTS_REACHED',
  DUPLICATE_RESPONSE: 'DUPLICATE_RESPONSE',

  // submit_survey_response
  RESPONSE_NOT_FOUND: 'RESPONSE_NOT_FOUND',
  RESPONSE_ALREADY_COMPLETED: 'RESPONSE_ALREADY_COMPLETED',

  // validate_and_save_answer
  QUESTION_NOT_FOUND: 'QUESTION_NOT_FOUND',
  QUESTION_SURVEY_MISMATCH: 'QUESTION_SURVEY_MISMATCH',
  RATING_REQUIRED: 'RATING_REQUIRED',
  RATING_OUT_OF_BOUNDS: 'RATING_OUT_OF_BOUNDS',
  SELECTED_MUST_BE_ARRAY: 'SELECTED_MUST_BE_ARRAY',
  MAX_SELECTIONS_EXCEEDED: 'MAX_SELECTIONS_EXCEEDED',
  MIN_SELECTIONS_NOT_MET: 'MIN_SELECTIONS_NOT_MET',
  INVALID_OPTION_SELECTED: 'INVALID_OPTION_SELECTED',
  YES_NO_INVALID: 'YES_NO_INVALID',
  TEXT_TOO_LONG: 'TEXT_TOO_LONG',

  // get_export_responses
  ACCESS_DENIED: 'ACCESS_DENIED',
} as const;

// ── PostgreSQL error codes ──────────────────────────────────────────

export const PG_ERROR = {
  UNIQUE_VIOLATION: '23505',
} as const;

// ── i18n error key mapping ──────────────────────────────────────────
// Maps RPC error identifiers → i18n keys (relative to `surveys.respondent`).

const RPC_ERROR_I18N: Record<string, string> = {
  [RPC_ERROR.SURVEY_NOT_FOUND]: 'closed.notFound',
  [RPC_ERROR.SURVEY_NOT_ACTIVE]: 'closed.completed',
  [RPC_ERROR.SURVEY_NOT_STARTED]: 'closed.notStarted',
  [RPC_ERROR.SURVEY_EXPIRED]: 'closed.expired',
  [RPC_ERROR.MAX_RESPONDENTS_REACHED]: 'closed.maxReached',
  [RPC_ERROR.RESPONSE_NOT_FOUND]: 'errors.startFailed',
  [RPC_ERROR.RESPONSE_ALREADY_COMPLETED]: 'errors.submitFailed',
  [RPC_ERROR.DUPLICATE_RESPONSE]: 'errors.duplicateResponse',
};

/**
 * Extract a known RPC error code from a Supabase error message and return
 * the corresponding i18n key. Falls back to `fallback` when the code is unrecognized.
 */
export function mapRpcError(errorMessage: string, fallback: string = 'errors.saveFailed'): string {
  for (const [code, i18nKey] of Object.entries(RPC_ERROR_I18N)) {
    if (errorMessage.includes(code)) {
      return i18nKey;
    }
  }

  return fallback;
}
