import { ROUTES } from '@/config';

export interface NavLink {
  href: string;
  label: string;
  disabled?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { href: ROUTES.common.home, label: 'common.solutions', disabled: true },
  { href: ROUTES.common.home, label: 'common.features', disabled: true },
  { href: ROUTES.common.home, label: 'common.pricing', disabled: true },
  { href: ROUTES.common.home, label: 'common.about', disabled: true },
];
