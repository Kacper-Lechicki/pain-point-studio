import { gridFeatures } from '@/config/marketing';

const FeaturesGrid = () => {
  return (
    <section className="bg-background py-16 sm:py-24">
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
            {gridFeatures.map((feature) => (
              <div key={feature.title} className="flex flex-col gap-5 sm:flex-row">
                <div className="bg-primary text-primary-foreground flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </div>

                <div className="flex-1">
                  <h3 className="text-foreground text-lg leading-8 font-semibold">
                    {feature.title}
                  </h3>

                  <p className="text-muted-foreground mt-1 text-base leading-7">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
