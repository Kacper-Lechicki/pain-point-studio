import StepCard from '@/components/marketing/elements/step-card';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { steps } from '@/config/marketing';

const HowItWorks = () => {
  const [firstStep, ...otherSteps] = steps;

  if (!firstStep) return null;

  return (
    <section className="relative overflow-hidden border-t border-white/5 py-0">
      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.1),transparent)]" />

      <div className="mx-auto w-full space-y-0">
        <div className="bg-background">
          <div className="container mx-auto px-6 pt-16 sm:px-4 sm:pt-24 lg:px-8">
            <ScrollReveal>
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  From Idea to Validated Problem in 15 Minutes
                </h2>
                <p className="text-muted-foreground mt-6 text-lg leading-8">
                  Stop theorizing. Start collecting real data from real people.
                </p>
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

        {otherSteps.map((step, index) => (
          <div
            key={step.id}
            className={`border-t border-white/5 py-20 transition-colors duration-1000 sm:py-32 ${
              (index + 1) % 2 === 1 ? 'bg-[#1a1a1a]' : 'bg-background'
            }`}
          >
            <div className="container mx-auto px-6 sm:px-4 lg:px-8">
              <ScrollReveal>
                <StepCard step={step} isReversed={(index + 1) % 2 !== 0} />
              </ScrollReveal>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
