import { getTranslations } from 'next-intl/server';

import { ProblemCard } from '@/features/marketing/components/common/problem-card';
import { PROBLEMS } from '@/features/marketing/config';

const Problems = async () => {
  const t = await getTranslations();

  const title = t('marketing.problems.title');
  const description = t('marketing.problems.description');

  return (
    <section className="from-background section-padding to-section-alt bg-linear-to-b transition-colors duration-1000">
      <div className="section-container">
        <div className="section-content">
          <h2 className="section-title">{title}</h2>
          <p className="section-description">{description}</p>
        </div>

        <div className="cards-grid">
          <ul className="grid auto-rows-fr grid-cols-1 gap-8 lg:grid-cols-3">
            {PROBLEMS.map((problem, index) => (
              <li key={`problem-${index}`}>
                <ProblemCard
                  icon={<problem.icon className="text-primary size-6" aria-hidden="true" />}
                  title={t(problem.titleKey)}
                  description={t(problem.descriptionKey)}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Problems;
