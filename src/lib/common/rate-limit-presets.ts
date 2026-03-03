/**
 * Centralized rate limit presets for all server actions.
 *
 * Each action still provides its own `key`; this file only defines
 * the `limit` + `windowSeconds` pairs so they can be reviewed and
 * adjusted in one place.
 */

export interface RateLimitPreset {
  limit: number;
  windowSeconds: number;
  /** Include user-agent in the key to differentiate users behind shared IPs. */
  includeUserAgent?: boolean;
}

export const RATE_LIMITS = {
  /** Auth flows: sign-in, complete-profile */
  auth: { limit: 5, windowSeconds: 300 },
  /** Strict auth: sign-up */
  authStrict: { limit: 3, windowSeconds: 300 },
  /** Sensitive operations: password change, email change, cancel email change */
  sensitive: { limit: 3, windowSeconds: 3600 },
  /** Less sensitive: password update (reset flow), unlink identity */
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
  /** Respondent: start response (includes UA to differentiate shared IPs) */
  respondentStart: { limit: 30, windowSeconds: 300, includeUserAgent: true },
  /** Respondent: save answer (very frequent, auto-save; includes UA) */
  respondentSave: { limit: 120, windowSeconds: 60, includeUserAgent: true },
  /** Respondent: submit response (includes UA) */
  respondentSubmit: { limit: 10, windowSeconds: 300, includeUserAgent: true },
  /** Respondent: record view (fire-and-forget, includes UA) */
  respondentView: { limit: 30, windowSeconds: 300, includeUserAgent: true },
  /** Respondent: read survey data (includes UA) */
  respondentRead: { limit: 60, windowSeconds: 60, includeUserAgent: true },
  /** Sign-out */
  signOut: { limit: 10, windowSeconds: 60 },
} as const satisfies Record<string, RateLimitPreset>;
