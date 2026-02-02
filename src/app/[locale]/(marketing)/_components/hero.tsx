'use client';

import { ChevronDown, Info, Send } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useTranslations } from 'next-intl';

import { BackgroundRippleEffect } from '@/components/ui/background-ripple-effect';
import { Button } from '@/components/ui/button';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import { ROUTES } from '@/config/routes';
import { Link } from '@/i18n/routing';

const Hero = () => {
  const t = useTranslations();
  const { scrollY } = useScroll();
  const scrollIndicatorOpacity = useTransform(scrollY, [0, 200], [1, 0]);

  const badge = t('Marketing.hero.badge');
  const title = t('Marketing.hero.title');
  const description = t('Marketing.hero.description');
  const startResearch = t('Common.startResearch');
  const seeHowItWorks = t('Common.seeHowItWorks');
  const noCreditCard = t('Common.noCreditCard');

  return (
    <section className="dark bg-background relative w-full overflow-hidden">
      <BackgroundRippleEffect rows={20} cols={50} />

      <div className="pointer-events-none relative z-10 container mx-auto flex flex-col items-center gap-8 px-6 py-24 text-center *:pointer-events-auto sm:px-4 md:py-32">
        <div className="bg-muted border-border inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium select-text">
          {badge}
        </div>

        <div className="max-w-4xl select-text">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            <TextGenerateEffect words={title} className="text-4xl md:text-6xl" duration={1.2} />
          </h1>
        </div>

        <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed select-text md:text-xl">
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

          <p className="text-muted-foreground text-xs select-text">{noCreditCard}</p>
        </div>
      </div>

      <motion.div
        className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2"
        style={{ opacity: scrollIndicatorOpacity }}
      >
        <ChevronDown className="text-foreground size-8" strokeWidth={2} aria-hidden="true" />
      </motion.div>

      <div className="from-background pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-32 w-full bg-linear-to-t to-transparent" />
    </section>
  );
};

export default Hero;
