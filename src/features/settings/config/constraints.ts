export type { LookupItem } from '@/lib/common/types';

// ── Profile constraints ─────────────────────────────────────────────

export const FULL_NAME_MAX_LENGTH = 100;
export const BIO_MAX_LENGTH = 200;
export const MAX_SOCIAL_LINKS = 5;

// ── Avatar constraints ──────────────────────────────────────────────

/** Maximum avatar file size in bytes (5 MB). */
export const AVATAR_MAX_SIZE = 5 * 1024 * 1024;
export const AVATAR_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Square output dimension in pixels after cropping. */
export const AVATAR_OUTPUT_SIZE = 512;
