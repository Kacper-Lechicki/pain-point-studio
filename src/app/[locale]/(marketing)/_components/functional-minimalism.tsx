import { getTranslations } from 'next-intl/server';

import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { FeatureCard } from '@/features/marketing/components/common/feature-card';
import { MINIMALISM_FEATURES } from '@/features/marketing/config';

const FunctionalMinimalism = async () => {
  const t = await getTranslations();

  const title = t('marketing.functionalMinimalism.title');
  const description = t('marketing.functionalMinimalism.description');

  return (
    <section className="bg-background section-padding border-t border-white/5 transition-colors duration-1000">
      <ScrollReveal>
        <div className="section-container">
          <div className="section-content">
            <h2 className="section-title">{title}</h2>
            <p className="section-description">{description}</p>
          </div>

          <div className="cards-grid">
            <div className="grid auto-rows-fr grid-cols-1 gap-8 lg:grid-cols-2">
              {MINIMALISM_FEATURES.map((feature, index) => (
                <FeatureCard
                  key={`feature-${index}`}
                  title={t(feature.titleKey)}
                  description={t(feature.descriptionKey)}
                  icon={<feature.icon className="size-6" aria-hidden="true" />}
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
