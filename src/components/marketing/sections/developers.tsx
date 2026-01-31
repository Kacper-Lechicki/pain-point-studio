import PersonaCard from '@/components/marketing/elements/persona-card';
import { developerPersonas } from '@/config/marketing';

const Developers = () => {
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="container mx-auto px-6 sm:px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for Different Types of Developers
          </h2>

          <p className="text-muted-foreground mt-6 text-lg leading-8">
            Whether you prefer working alone or finding collaborators, Pain Point Studio adapts to
            your style.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {developerPersonas.map((persona) => (
              <PersonaCard key={persona.title} {...persona} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Developers;
