interface LookupItem {
  value: string;
  labelKey: string;
}

export const ROLES: readonly LookupItem[] = [
  { value: 'solo-developer', labelKey: 'settings.roles.soloDeveloper' },
  { value: 'product-manager', labelKey: 'settings.roles.productManager' },
  { value: 'designer', labelKey: 'settings.roles.designer' },
  { value: 'founder', labelKey: 'settings.roles.founder' },
  { value: 'student', labelKey: 'settings.roles.student' },
  { value: 'other', labelKey: 'settings.roles.other' },
] as const;

export const ROLE_VALUES = ROLES.map((r) => r.value);
