'use client';

import dynamic from 'next/dynamic';

import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { ROUTES } from '@/config';
import { Link } from '@/i18n/routing';

const HeroHighlight = dynamic(
  () => import('@/components/ui/hero-highlight').then((mod) => ({ default: mod.HeroHighlight })),
  {
    ssr: true,
    loading: () => <div className="bg-background mb-16 py-16 sm:mb-16 sm:py-24" />,
  }
);

const Cta = () => {
  const t = useTranslations();

  const title = t('marketing.cta.title');
  const description = t('marketing.cta.description');
  const startResearch = t('common.startResearch');
  const noCreditCard = t('common.noCreditCard');

  return (
    <HeroHighlight containerClassName="bg-background pt-20 pb-32 sm:py-32 mb-16 sm:mb-16">
      <ScrollReveal>
        <div className="relative z-10 container mx-auto px-6 sm:px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              {title}
            </h2>

            <p className="text-muted-foreground mt-6 text-lg leading-8">{description}</p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4">
              <Button asChild size="lg" className="h-12 gap-2 px-8 text-base">
                <Link href={ROUTES.auth.signIn}>
                  {startResearch}
                  <Send className="size-4" aria-hidden="true" />
                </Link>
              </Button>

              <p className="text-muted-foreground text-xs">{noCreditCard}</p>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </HeroHighlight>
  );
};

export default Cta;
