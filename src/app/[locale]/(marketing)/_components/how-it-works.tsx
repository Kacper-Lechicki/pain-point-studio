'use client';

import { useTranslations } from 'next-intl';

import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { StepCard } from '@/features/marketing/components/common/step-card';
import { HOW_IT_WORKS_STEPS } from '@/features/marketing/config';

const HowItWorks = () => {
  const t = useTranslations();
  const [firstStep, ...otherSteps] = HOW_IT_WORKS_STEPS;

  const title = t('marketing.howItWorks.title');
  const description = t('marketing.howItWorks.description');

  if (!firstStep) {
    return null;
  }

  return (
    <section className="relative overflow-hidden border-t border-white/5 py-0">
      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,var(--grid-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-line)_1px,transparent_1px)] bg-size-[24px_24px]" />
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,color-mix(in_srgb,var(--section-glow),transparent_90%),transparent)]" />

      <div className="mx-auto w-full space-y-0">
        <div className="bg-background">
          <div className="container mx-auto px-6 pt-16 sm:px-4 sm:pt-24 lg:px-8">
            <ScrollReveal>
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
                <p className="text-muted-foreground mt-6 text-lg leading-8">{description}</p>
              </div>
            </ScrollReveal>
          </div>

          <div className="py-20 sm:py-32">
            <div className="container mx-auto px-6 sm:px-4 lg:px-8">
              <ScrollReveal>
                <StepCard step={firstStep} isReversed={false} />
              </ScrollReveal>
            </div>
          </div>
        </div>

        {otherSteps.map((step, index) => {
          const bgClass = index % 2 === 0 ? 'bg-section-alt' : 'bg-background';
          const isReversed = step.id % 2 === 0;

          return (
            <div
              key={step.id}
              className={`border-t border-white/5 py-20 transition-colors duration-1000 sm:py-32 ${bgClass}`}
            >
              <div className="container mx-auto px-6 sm:px-4 lg:px-8">
                <ScrollReveal>
                  <StepCard step={step} isReversed={isReversed} />
                </ScrollReveal>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HowItWorks;
