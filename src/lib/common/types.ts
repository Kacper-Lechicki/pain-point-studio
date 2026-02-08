/**
 * Generic result type for server actions.
 * Discriminated union: either success or error (never both).
 */
export type ActionResult =
  | { success: true; error?: undefined }
  | { error: string; success?: undefined };
