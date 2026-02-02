import FeatureCard from '@/components/marketing/elements/feature-card';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { MINIMALISM_FEATURES, MinimalismFeature } from '@/config/marketing';

const FunctionalMinimalism = () => {
  return (
    <section className="bg-background border-t border-white/5 py-16 transition-colors duration-1000 sm:py-24">
      <ScrollReveal>
        <div className="container mx-auto px-6 sm:px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built on Functional Minimalism
            </h2>

            <p className="text-muted-foreground mt-6 text-lg leading-8">
              Every feature must pass one test: Is it absolutely necessary to go from `I don&apos;t
              know what to build` to `I have a validated problem worth solving`?
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid auto-rows-fr grid-cols-1 gap-8 lg:grid-cols-2">
              {MINIMALISM_FEATURES.map((feature: MinimalismFeature) => (
                <FeatureCard
                  key={feature.title}
                  title={feature.title}
                  description={feature.description}
                  icon={feature.icon}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
};

export default FunctionalMinimalism;
