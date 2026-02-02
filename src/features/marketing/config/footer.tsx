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
    title: 'Common.product',
    items: [
      { label: 'Common.features', href: ROUTES.marketing.features, disabled: true },
      { label: 'Common.templates', href: '#', disabled: true },
      { label: 'Common.pricing', href: ROUTES.marketing.pricing, disabled: true },
      { label: 'Common.roadmap', href: '#', disabled: true },
    ],
  },
  {
    title: 'Common.resources',
    items: [
      { label: 'Common.documentation', href: ROUTES.resources.docs, disabled: true },
      { label: 'Common.blog', href: ROUTES.resources.blog, disabled: true },
      { label: 'Common.caseStudies', href: ROUTES.resources.caseStudies, disabled: true },
      { label: 'Common.community', href: ROUTES.resources.community, disabled: true },
    ],
  },
  {
    title: 'Common.company',
    items: [
      { label: 'Common.about', href: ROUTES.marketing.about, disabled: true },
      { label: 'Common.philosophy', href: '#', disabled: true },
      { label: 'Common.privacy', href: ROUTES.legal.privacy, disabled: true },
      { label: 'Common.terms', href: ROUTES.legal.terms, disabled: true },
    ],
  },
];
