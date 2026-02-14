interface LookupItem {
  value: string;
  labelKey: string;
}

export const SOCIAL_LINK_TYPES: readonly LookupItem[] = [
  { value: 'website', labelKey: 'settings.profile.socialLinks.labels.website' },
  { value: 'github', labelKey: 'settings.profile.socialLinks.labels.github' },
  { value: 'twitter', labelKey: 'settings.profile.socialLinks.labels.twitter' },
  { value: 'linkedin', labelKey: 'settings.profile.socialLinks.labels.linkedin' },
  { value: 'other', labelKey: 'settings.profile.socialLinks.labels.other' },
] as const;

export const SOCIAL_LINK_TYPE_VALUES = SOCIAL_LINK_TYPES.map((s) => s.value);
