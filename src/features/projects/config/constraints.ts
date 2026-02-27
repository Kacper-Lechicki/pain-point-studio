// ── Project constraints ─────────────────────────────────────────────

export const PROJECT_NAME_MAX_LENGTH = 100;
export const PROJECT_SUMMARY_MAX_LENGTH = 280;

// ── Description (rich text) constraints ────────────────────────────

export const PROJECT_DESCRIPTION_DEBOUNCE_MS = 1_500;

// ── Image constraints ──────────────────────────────────────────────

export const PROJECT_IMAGE_MAX_SIZE = 2 * 1024 * 1024; // 2 MB
export const PROJECT_IMAGE_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const PROJECT_IMAGE_DIMENSION = 256;

// ── Insight constraints ─────────────────────────────────────────────

export const INSIGHT_CONTENT_MAX_LENGTH = 500;

// ── Notes constraints ───────────────────────────────────────────────

export const PROJECT_NOTES_MAX_LENGTH = 50_000;
export const PROJECT_NOTES_DEBOUNCE_MS = 1_500;
