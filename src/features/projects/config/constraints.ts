import { IMAGE_ACCEPTED_TYPES, IMAGE_MAX_SIZE } from '@/config/uploads';

// ── Project constraints ─────────────────────────────────────────────

/** Days until trashed projects are permanently purged (must match DB cron). */
export const PROJECT_TRASH_RETENTION_DAYS = 30;

export const PROJECT_NAME_MAX_LENGTH = 100;
export const PROJECT_SUMMARY_MAX_LENGTH = 300;

// ── Image constraints ──────────────────────────────────────────────

export const PROJECT_IMAGE_MAX_SIZE = IMAGE_MAX_SIZE;
export const PROJECT_IMAGE_ACCEPTED_TYPES = IMAGE_ACCEPTED_TYPES;
export const PROJECT_IMAGE_DIMENSION = 256;

// ── Insight constraints ─────────────────────────────────────────────

export const INSIGHT_CONTENT_MAX_LENGTH = 500;

// ── Notes constraints ───────────────────────────────────────────────

export const NOTE_TITLE_MAX_LENGTH = 200;
export const NOTE_CONTENT_DEBOUNCE_MS = 1_500;
export const FOLDER_NAME_MAX_LENGTH = 100;

// ── UI timing ──────────────────────────────────────────────────────

/** Duration (ms) to show "Saved" feedback before resetting to idle. */
export const SAVE_STATUS_FEEDBACK_MS = 2_000;
