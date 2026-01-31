import Link from 'next/link';

import { Info, Send } from 'lucide-react';

import { BackgroundRippleEffect } from '@/components/ui/background-ripple-effect';
import { Button } from '@/components/ui/button';

const Hero = () => {
  return (
    <section className="dark bg-background relative w-full overflow-hidden">
      <BackgroundRippleEffect rows={20} cols={50} />

      <div className="pointer-events-none relative z-10 container mx-auto flex flex-col items-center gap-8 px-6 py-24 text-center sm:px-4 md:py-32">
        <div className="bg-muted border-border inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium">
          Stop Building Things Nobody Needs
        </div>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
          Discover Real Problems <br className="hidden sm:inline" />
          Before Writing Code
        </h1>

        <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed md:text-xl">
          Pain Point Studio helps solo developers validate ideas through structured customer
          research. Find out what people actually need in 15 minutes, not 3 months.
        </p>

        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button className="pointer-events-auto h-11 gap-2 px-8 text-base" asChild>
              <Link href="/start">
                Start Your First Research
                <Send className="size-4" />
              </Link>
            </Button>

            <Button
              variant="secondary"
              className="pointer-events-auto h-11 gap-2 px-8 text-base"
              asChild
            >
              <Link href="/how-it-works">
                See How It Works
                <Info className="size-4" />
              </Link>
            </Button>
          </div>

          <p className="text-muted-foreground text-xs">No credit card required</p>
        </div>
      </div>

      <div className="from-background absolute right-0 bottom-0 left-0 z-10 h-32 w-full bg-linear-to-t to-transparent" />
    </section>
  );
};

export default Hero;
