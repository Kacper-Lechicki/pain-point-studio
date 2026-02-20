import type { LookupItem } from '@/features/settings/config';

/** Available social link types displayed in the profile form. */
export const SOCIAL_LINK_TYPES: readonly LookupItem[] = [
  { value: 'website', labelKey: 'settings.profile.socialLinks.labels.website' },
  { value: 'github', labelKey: 'settings.profile.socialLinks.labels.github' },
  { value: 'twitter', labelKey: 'settings.profile.socialLinks.labels.twitter' },
  { value: 'linkedin', labelKey: 'settings.profile.socialLinks.labels.linkedin' },
  { value: 'other', labelKey: 'settings.profile.socialLinks.labels.other' },
] as const;

/** Domain restrictions for provider-specific social links (used by Zod validation). */
export const SOCIAL_LINK_DOMAINS: Record<string, string[]> = {
  github: ['github.com'],
  twitter: ['twitter.com', 'x.com'],
  linkedin: ['linkedin.com'],
};
