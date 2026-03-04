'use client';

import { ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { BRAND, ROUTES, getCopyrightText } from '@/config';
import { FOOTER_SECTIONS } from '@/features/marketing/config';
import { Link } from '@/i18n/routing';

const Footer = () => {
  const t = useTranslations();
  const brandName = t(BRAND.name);
  const brandTagline = t(BRAND.tagline);
  const copyrightText = getCopyrightText(t);

  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-6 py-12 sm:px-4 lg:px-8">
        <div className="divide-border flex flex-col divide-y lg:grid lg:grid-cols-5 lg:gap-8 lg:divide-y-0">
          <div className="col-span-2 flex flex-col gap-4 py-8 first:pt-0 lg:py-0">
            <Link href={ROUTES.common.home} className="text-lg font-semibold tracking-tight">
              {brandName}
            </Link>

            <p className="text-muted-foreground text-xs leading-relaxed">{brandTagline}</p>
          </div>

          {FOOTER_SECTIONS.map((section, sectionIndex) => (
            <div
              key={`footer-section-${sectionIndex}`}
              className="col-span-1 flex min-w-0 flex-col gap-4 py-8 last:pb-0 lg:py-0"
            >
              <h3 className="text-sm font-semibold">{t(section.title)}</h3>

              <ul className="flex flex-col gap-2">
                {section.items.map((item, itemIndex) => (
                  <li key={`footer-item-${sectionIndex}-${itemIndex}`}>
                    {item.disabled ? (
                      <span className="text-disabled-foreground block cursor-not-allowed py-2 text-lg font-medium wrap-break-word lg:py-0 lg:text-sm lg:font-normal">
                        {t(item.label)}
                      </span>
                    ) : (
                      <Link
                        href={item.href}
                        className="text-muted-foreground md:hover:text-foreground block py-2 text-lg font-medium wrap-break-word transition-colors lg:py-0 lg:text-sm lg:font-normal"
                      >
                        {t(item.label)}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-between border-t pt-8">
          <p className="text-muted-foreground text-xs">{copyrightText}</p>

          <Button
            variant="ghost"
            size="icon-md"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label={t('common.aria.scrollToTop')}
          >
            <ArrowUp className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </footer>
  );
};

export { Footer };
