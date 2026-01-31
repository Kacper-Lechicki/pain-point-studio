'use client';

import { useState } from 'react';

import { PointerHighlight } from '@/components/ui/pointer-highlight';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { gridFeatures } from '@/config/marketing';

const FeaturesGrid = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="bg-background border-t border-white/5 py-16 transition-colors duration-1000 sm:py-24">
      <ScrollReveal>
        <div className="container mx-auto px-6 sm:px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need, Nothing You Don&apos;t
            </h2>

            <p className="text-muted-foreground mt-6 text-lg leading-8">
              Focused tools that help you validate ideas without the bloat.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-2">
              {gridFeatures.map((feature, idx) => (
                <div
                  key={feature.title}
                  className="flex flex-col gap-5 sm:flex-row"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="bg-primary text-primary-foreground flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>

                  <div className="flex-1">
                    <PointerHighlight active={hoveredIndex === idx}>
                      <h3 className="text-foreground w-fit text-lg leading-8 font-semibold">
                        {feature.title}
                      </h3>
                    </PointerHighlight>

                    <p className="text-muted-foreground mt-1 text-base leading-7">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
};

export default FeaturesGrid;
