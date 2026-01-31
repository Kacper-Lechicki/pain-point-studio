'use client';

import Link from 'next/link';

import { Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { HeroHighlight } from '@/components/ui/hero-highlight';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

const Cta = () => {
  return (
    <HeroHighlight containerClassName="bg-background py-32 sm:py-48 min-h-[40rem] mb-16 sm:mb-24">
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
                <Link href="/sign-in">
                  Start Your First Research
                  <Send className="size-4" />
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
