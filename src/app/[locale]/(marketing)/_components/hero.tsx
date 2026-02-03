import { Suspense } from 'react';

import { ChevronDown, Info, Send } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/routes';
import { Link } from '@/i18n/routing';

import { BackgroundRippleEffect } from './hero-client';

const Hero = async () => {
  const t = await getTranslations();

  const badge = t('marketing.hero.badge');
  const title = t('marketing.hero.title');
  const description = t('marketing.hero.description');
  const startResearch = t('common.startResearch');
  const seeHowItWorks = t('common.seeHowItWorks');
  const noCreditCard = t('common.noCreditCard');

  return (
    <section className="dark bg-background relative w-full overflow-hidden">
      <Suspense fallback={null}>
        <BackgroundRippleEffect rows={10} cols={30} />
      </Suspense>

      <div className="pointer-events-none relative z-10 container mx-auto flex flex-col items-center gap-8 px-6 py-24 text-center *:pointer-events-auto sm:px-4 md:py-32">
        <div className="bg-muted border-border inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium">
          {badge}
        </div>

        <h1 className="max-w-4xl text-4xl leading-snug font-bold tracking-tight md:text-6xl">
          {title}
        </h1>

        <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed md:text-xl">
          {description}
        </p>

        <div className="flex flex-col items-center gap-4 max-sm:w-full max-sm:max-w-2xl">
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
            <Button className="h-11 gap-2 px-8 text-base" asChild>
              <Link href={ROUTES.marketing.start}>
                {startResearch}
                <Send className="size-4" aria-hidden="true" />
              </Link>
            </Button>

            <Button variant="secondary" className="h-11 gap-2 px-8 text-base" asChild>
              <Link href={ROUTES.marketing.howItWorks}>
                {seeHowItWorks}
                <Info className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <p className="text-muted-foreground text-xs">{noCreditCard}</p>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2 opacity-30">
        <ChevronDown className="text-foreground size-8" strokeWidth={2} aria-hidden="true" />
      </div>

      <div className="from-background pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-32 w-full bg-linear-to-t to-transparent" />
    </section>
  );
};

export default Hero;
