import { ROUTES } from '@/config';
import type { MessageKey } from '@/i18n/types';

interface NavLink {
  href: string;
  label: MessageKey;
  disabled?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { href: ROUTES.common.home, label: 'common.solutions', disabled: true },
  { href: ROUTES.common.home, label: 'common.features', disabled: true },
  { href: ROUTES.common.home, label: 'common.pricing', disabled: true },
  { href: ROUTES.common.home, label: 'common.about', disabled: true },
];
