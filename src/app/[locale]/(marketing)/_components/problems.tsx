'use client';

import { useTranslations } from 'next-intl';

import { ScrollReveal } from '@/components/ui/scroll-reveal';
import ProblemCard from '@/features/marketing/components/elements/problem-card';
import { PROBLEMS, type Problem } from '@/features/marketing/config';

const Problems = () => {
  const t = useTranslations();

  const title = t('marketing.problems.title');
  const description = t('marketing.problems.description');

  return (
    <section className="from-background section-padding bg-linear-to-b to-[#1a1a1a] transition-colors duration-1000">
      <ScrollReveal>
        <div className="section-container">
          <div className="section-content">
            <h2 className="section-title">{title}</h2>
            <p className="section-description">{description}</p>
          </div>

          <div className="cards-grid">
            <ul className="grid auto-rows-fr grid-cols-1 gap-8 lg:grid-cols-3">
              {PROBLEMS.map((problem: Problem, index: number) => (
                <li key={`problem-${index}`}>
                  <ProblemCard
                    icon={problem.icon}
                    titleKey={problem.titleKey}
                    descriptionKey={problem.descriptionKey}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
};

export default Problems;
