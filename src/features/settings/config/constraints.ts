import { IMAGE_ACCEPTED_TYPES, IMAGE_MAX_SIZE } from '@/config/uploads';

export type { LookupItem } from '@/lib/common/types';

// ── Profile constraints ─────────────────────────────────────────────

export const FULL_NAME_MAX_LENGTH = 100;
export const BIO_MAX_LENGTH = 200;
export const MAX_SOCIAL_LINKS = 5;

// ── Avatar constraints ──────────────────────────────────────────────

/** Maximum avatar file size in bytes (5 MB). */
export const AVATAR_MAX_SIZE = IMAGE_MAX_SIZE;
export const AVATAR_ACCEPTED_TYPES = IMAGE_ACCEPTED_TYPES;

/** Square output dimension in pixels after cropping. */
export const AVATAR_OUTPUT_SIZE = 512;
