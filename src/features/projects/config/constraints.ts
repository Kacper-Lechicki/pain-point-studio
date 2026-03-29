import { IMAGE_ACCEPTED_TYPES, IMAGE_MAX_SIZE } from '@/config/uploads';

// ── Project constraints ─────────────────────────────────────────────

/** Days until trashed projects are permanently purged (must match DB cron). */
export const PROJECT_TRASH_RETENTION_DAYS = 30;

export const PROJECT_NAME_MAX_LENGTH = 100;
export const PROJECT_SUMMARY_MAX_LENGTH = 300;

/** Maximum responses per project (plan limit). Must match DB default + migration. */
export const PROJECT_RESPONSE_LIMIT = 50;

// ── Image constraints ──────────────────────────────────────────────

export const PROJECT_IMAGE_MAX_SIZE = IMAGE_MAX_SIZE;
export const PROJECT_IMAGE_ACCEPTED_TYPES = IMAGE_ACCEPTED_TYPES;
export const PROJECT_IMAGE_DIMENSION = 256;

// ── Notes constraints ───────────────────────────────────────────────

export const NOTE_TITLE_MAX_LENGTH = 200;
export const FOLDER_NAME_MAX_LENGTH = 100;
