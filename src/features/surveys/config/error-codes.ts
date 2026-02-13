// ── Supabase RPC error identifiers ──────────────────────────────────

export const RPC_ERROR = {
  MAX_RESPONDENTS_REACHED: 'MAX_RESPONDENTS_REACHED',
  SURVEY_NOT_ACTIVE: 'SURVEY_NOT_ACTIVE',
} as const;

// ── PostgreSQL error codes ──────────────────────────────────────────

export const PG_ERROR = {
  UNIQUE_VIOLATION: '23505',
} as const;
