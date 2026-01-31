import StepCard from '@/components/marketing/elements/step-card';
import { steps } from '@/config/marketing';

const HowItWorks = () => {
  return (
    <section className="bg-background relative overflow-hidden py-16 sm:py-24">
      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.1),transparent)]" />

      <div className="container mx-auto px-6 sm:px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            From Idea to Validated Problem in 15 Minutes
          </h2>
          <p className="text-muted-foreground mt-6 text-lg leading-8">
            Stop theorizing. Start collecting real data from real people.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl lg:mt-24 lg:max-w-none">
          <div className="space-y-24 lg:space-y-32">
            {steps.map((step, index) => (
              <StepCard key={step.id} step={step} isReversed={index % 2 !== 0} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
