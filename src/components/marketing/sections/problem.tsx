import ProblemCard from '@/components/marketing/elements/problem-card';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { PROBLEMS, type Problem } from '@/config/marketing';

const Problem = () => {
  return (
    <section className="from-background bg-linear-to-b to-[#1a1a1a] py-16 transition-colors duration-1000 sm:py-24">
      <ScrollReveal>
        <div className="container mx-auto px-6 sm:px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              The Problem Most Developers Face
            </h2>

            <p className="text-muted-foreground mt-6 text-lg leading-8">
              70% of side projects are abandoned within 3 months. Not because of bad code, but
              because they solve problems that don&apos;t exist.
            </p>
          </div>

          <div className="mx-auto mt-16 w-full sm:mt-20 lg:mt-24">
            <dl className="grid auto-rows-fr grid-cols-1 gap-8 lg:grid-cols-3">
              {PROBLEMS.map((problem: Problem) => (
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
      </ScrollReveal>
    </section>
  );
};

export default Problem;
