import type { LookupItem } from '@/features/settings/config';

/** Available user roles displayed in the profile form. "other" must stay last. */
export const ROLES: readonly LookupItem[] = [
  { value: 'developer', labelKey: 'settings.roles.developer' },
  { value: 'designer', labelKey: 'settings.roles.designer' },
  { value: 'product-manager', labelKey: 'settings.roles.productManager' },
  { value: 'student', labelKey: 'settings.roles.student' },
  { value: 'other', labelKey: 'settings.roles.other' },
] as const;

export const ROLE_VALUES = ROLES.map((r) => r.value);
