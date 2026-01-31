'use client';

import Link from 'next/link';

import { ArrowUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { footerSections } from '@/config/marketing';

const Footer = () => {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-6 py-12 sm:px-4 lg:px-8">
        <div className="divide-border flex flex-col divide-y lg:grid lg:grid-cols-5 lg:gap-8 lg:divide-y-0">
          <div className="col-span-2 flex flex-col gap-4 py-8 first:pt-0 lg:py-0">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Pain Point Studio
            </Link>

            <p className="text-muted-foreground text-sm leading-relaxed">
              Validate ideas before writing code.
            </p>
          </div>

          {footerSections.map((section) => (
            <div
              key={section.title}
              className="col-span-1 flex min-w-0 flex-col gap-4 py-8 last:pb-0 lg:py-0"
            >
              <h3 className="text-sm font-semibold">{section.title}</h3>

              <ul className="flex flex-col gap-2">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground block text-sm wrap-break-word transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-between border-t pt-8">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} Pain Point Studio. All rights reserved.
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Scroll to top"
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
