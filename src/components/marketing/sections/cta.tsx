import Link from 'next/link';

import { Send } from 'lucide-react';

import { Button } from '@/components/ui/button';

const Cta = () => {
  return (
    <section className="bg-background pt-16 pb-32 sm:pt-24 sm:pb-48">
      <div className="container mx-auto px-6 sm:px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
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
    </section>
  );
};

export default Cta;
