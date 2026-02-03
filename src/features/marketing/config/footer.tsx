import { AppRoute, ROUTES } from '@/config/routes';

export interface FooterItem {
  label: string;
  href: AppRoute | '#';
  disabled?: boolean;
  external?: boolean;
}

export interface FooterSection {
  title: string;
  items: FooterItem[];
}

export const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: 'common.product',
    items: [
      { label: 'common.features', href: ROUTES.marketing.features, disabled: true },
      { label: 'common.templates', href: '#', disabled: true },
      { label: 'common.pricing', href: ROUTES.marketing.pricing, disabled: true },
      { label: 'common.roadmap', href: '#', disabled: true },
    ],
  },
  {
    title: 'common.resources',
    items: [
      { label: 'common.documentation', href: ROUTES.resources.docs, disabled: true },
      { label: 'common.blog', href: ROUTES.resources.blog, disabled: true },
      { label: 'common.caseStudies', href: ROUTES.resources.caseStudies, disabled: true },
      { label: 'common.community', href: ROUTES.resources.community, disabled: true },
    ],
  },
  {
    title: 'common.company',
    items: [
      { label: 'common.about', href: ROUTES.marketing.about, disabled: true },
      { label: 'common.philosophy', href: '#', disabled: true },
      { label: 'common.privacy', href: ROUTES.legal.privacy, disabled: true },
      { label: 'common.terms', href: ROUTES.legal.terms, disabled: true },
    ],
  },
];
