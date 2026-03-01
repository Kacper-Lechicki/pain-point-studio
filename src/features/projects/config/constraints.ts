// ── Project constraints ─────────────────────────────────────────────

export const PROJECT_NAME_MAX_LENGTH = 100;
export const PROJECT_SUMMARY_MAX_LENGTH = 300;

// ── Bio (plain-text description at creation) constraints ───────────

export const PROJECT_BIO_MAX_LENGTH = 1000;

// ── Description (rich text) constraints ────────────────────────────

export const PROJECT_DESCRIPTION_DEBOUNCE_MS = 1_500;

// ── Image constraints ──────────────────────────────────────────────

export const PROJECT_IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5 MB
export const PROJECT_IMAGE_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const PROJECT_IMAGE_DIMENSION = 256;

// ── Insight constraints ─────────────────────────────────────────────

export const INSIGHT_CONTENT_MAX_LENGTH = 500;

// ── Notes constraints ───────────────────────────────────────────────

export const NOTE_TITLE_MAX_LENGTH = 200;
export const NOTE_CONTENT_DEBOUNCE_MS = 1_500;
export const FOLDER_NAME_MAX_LENGTH = 100;
