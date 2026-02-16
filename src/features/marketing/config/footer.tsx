import { type AppRoute, ROUTES } from '@/config';
import type { MessageKey } from '@/i18n/types';

export interface FooterItem {
  label: MessageKey;
  href: AppRoute | '#';
  disabled?: boolean;
  external?: boolean;
}

export interface FooterSection {
  title: MessageKey;
  items: FooterItem[];
}

export const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: 'common.product',
    items: [
      { label: 'common.features', href: ROUTES.common.home, disabled: true },
      { label: 'common.templates', href: '#', disabled: true },
      { label: 'common.pricing', href: ROUTES.common.home, disabled: true },
      { label: 'common.roadmap', href: '#', disabled: true },
    ],
  },
  {
    title: 'common.resources',
    items: [
      { label: 'common.documentation', href: ROUTES.common.home, disabled: true },
      { label: 'common.blog', href: ROUTES.common.home, disabled: true },
      { label: 'common.caseStudies', href: ROUTES.common.home, disabled: true },
      { label: 'common.community', href: ROUTES.common.home, disabled: true },
    ],
  },
  {
    title: 'common.company',
    items: [
      { label: 'common.about', href: ROUTES.common.home, disabled: true },
      { label: 'common.philosophy', href: '#', disabled: true },
      { label: 'common.privacy', href: ROUTES.common.home, disabled: true },
      { label: 'common.terms', href: ROUTES.common.home, disabled: true },
    ],
  },
];
