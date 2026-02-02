'use client';

import { useTranslations } from 'next-intl';

import ProblemCard from '@/components/marketing/elements/problem-card';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { PROBLEMS, type Problem } from '@/config/marketing';

const Problems = () => {
  const t = useTranslations();

  const title = t('Marketing.problems.title');
  const description = t('Marketing.problems.description');

  return (
    <section className="from-background section-padding bg-linear-to-b to-[#1a1a1a] transition-colors duration-1000">
      <ScrollReveal>
        <div className="section-container">
          <div className="section-content">
            <h2 className="section-title">{title}</h2>
            <p className="section-description">{description}</p>
          </div>

          <div className="cards-grid">
            <dl className="grid auto-rows-fr grid-cols-1 gap-8 lg:grid-cols-3">
              {PROBLEMS.map((problem: Problem, index: number) => (
                <ProblemCard
                  key={`problem-${index}`}
                  icon={problem.icon}
                  titleKey={problem.titleKey}
                  descriptionKey={problem.descriptionKey}
                />
              ))}
            </dl>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
};

export default Problems;
