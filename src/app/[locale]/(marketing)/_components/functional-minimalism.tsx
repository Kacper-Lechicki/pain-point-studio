'use client';

import { useTranslations } from 'next-intl';

import { ScrollReveal } from '@/components/ui/scroll-reveal';
import FeatureCard from '@/features/marketing/components/elements/feature-card';
import { MINIMALISM_FEATURES, MinimalismFeature } from '@/features/marketing/config';

const FunctionalMinimalism = () => {
  const t = useTranslations();

  const title = t('Marketing.minimalism.title');
  const description = t('Marketing.minimalism.description');

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
              {MINIMALISM_FEATURES.map((feature: MinimalismFeature, index: number) => (
                <FeatureCard
                  key={`feature-${index}`}
                  titleKey={feature.titleKey}
                  descriptionKey={feature.descriptionKey}
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
