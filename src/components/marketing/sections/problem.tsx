import ProblemCard from '@/components/marketing/elements/problem-card';
import { problems } from '@/config/marketing';

const Problem = () => {
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="container mx-auto px-6 sm:px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            The Problem Most Developers Face
          </h2>

          <p className="text-muted-foreground mt-6 text-lg leading-8">
            70% of side projects are abandoned within 3 months. Not because of bad code, but because
            they solve problems that don&apos;t exist.
          </p>
        </div>

        <div className="mx-auto mt-16 w-full sm:mt-20 lg:mt-24">
          <dl className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {problems.map((problem) => (
              <ProblemCard
                key={problem.title}
                icon={problem.icon}
                title={problem.title}
                description={problem.description}
              />
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
};

export default Problem;
