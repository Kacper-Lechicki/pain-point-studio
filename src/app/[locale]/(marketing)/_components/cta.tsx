'use client';

import { Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { HeroHighlight } from '@/components/ui/hero-highlight';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { ROUTES } from '@/config/routes';
import { Link } from '@/i18n/routing';

const Cta = () => {
  return (
    <HeroHighlight containerClassName="bg-background py-16 sm:py-24 mb-16 sm:mb-16">
      <ScrollReveal>
        <div className="relative z-10 container mx-auto px-6 sm:px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              Stop Guessing. Start Knowing.
            </h2>

            <p className="text-muted-foreground mt-6 text-lg leading-8">
              Join developers who validate ideas before writing code. Your first 5 research missions
              are free.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4">
              <Button asChild size="lg" className="h-12 gap-2 px-8 text-base">
                <Link href={ROUTES.auth.signIn}>
                  Start Your First Research
                  <Send className="size-4" aria-hidden="true" />
                </Link>
              </Button>

              <p className="text-muted-foreground text-xs">No credit card required</p>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </HeroHighlight>
  );
};

export default Cta;
