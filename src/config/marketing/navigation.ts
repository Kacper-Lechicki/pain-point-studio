import { ROUTES } from '@/config/routes';

export interface NavLink {
  href: string;
  label: string;
  disabled?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { href: ROUTES.marketing.solutions, label: 'Common.solutions', disabled: true },
  { href: ROUTES.marketing.features, label: 'Common.features', disabled: true },
  { href: ROUTES.marketing.pricing, label: 'Common.pricing', disabled: true },
  { href: ROUTES.marketing.about, label: 'Common.about', disabled: true },
];
