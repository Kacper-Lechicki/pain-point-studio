import { ROUTES } from '@/config/routes';

export interface NavLink {
  href: string;
  label: string;
  disabled?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { href: ROUTES.marketing.solutions, label: 'common.solutions', disabled: true },
  { href: ROUTES.marketing.features, label: 'common.features', disabled: true },
  { href: ROUTES.marketing.pricing, label: 'common.pricing', disabled: true },
  { href: ROUTES.marketing.about, label: 'common.about', disabled: true },
];
