/**
 * Centralized rate limit presets for all server actions.
 *
 * Each action still provides its own `key`; this file only defines
 * the `limit` + `windowSeconds` pairs so they can be reviewed and
 * adjusted in one place.
 */

type RateLimitPreset = { limit: number; windowSeconds: number };

export const RATE_LIMITS = {
  /** Auth flows: sign-in, complete-profile */
  auth: { limit: 5, windowSeconds: 300 },

  /** Strict auth: sign-up */
  authStrict: { limit: 3, windowSeconds: 300 },

  /** Sensitive operations: password change, email change, unlink identity, cancel email */
  sensitive: { limit: 3, windowSeconds: 3600 },

  /** Less sensitive auth-adjacent: password update (reset flow), unlink identity */
  sensitiveRelaxed: { limit: 5, windowSeconds: 3600 },

  /** Destructive: delete account */
  destructive: { limit: 1, windowSeconds: 3600 },

  /** Standard CRUD operations: status changes, publish */
  crud: { limit: 10, windowSeconds: 300 },

  /** Frequent saves: survey questions auto-save */
  frequentSave: { limit: 60, windowSeconds: 60 },

  /** Bulk creation: create survey draft */
  bulkCreate: { limit: 20, windowSeconds: 300 },

  /** Export operations: CSV/JSON exports */
  export: { limit: 10, windowSeconds: 60 },

  /** Avatar/file upload */
  upload: { limit: 10, windowSeconds: 60 },

  /** Profile updates */
  profileUpdate: { limit: 10, windowSeconds: 300 },

  /** Respondent: start response */
  respondentStart: { limit: 30, windowSeconds: 300 },

  /** Respondent: save answer (very frequent, auto-save) */
  respondentSave: { limit: 120, windowSeconds: 60 },

  /** Respondent: submit response */
  respondentSubmit: { limit: 10, windowSeconds: 300 },
} as const satisfies Record<string, RateLimitPreset>;
