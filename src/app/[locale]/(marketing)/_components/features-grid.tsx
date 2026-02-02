'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { PointerHighlight } from '@/components/ui/pointer-highlight';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { GRID_FEATURES, GridFeature } from '@/config/marketing';

const FeaturesGrid = () => {
  const t = useTranslations();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const title = t('Marketing.featuresGrid.title');
  const description = t('Marketing.featuresGrid.description');

  return (
    <section className="bg-background section-padding border-t border-white/5 transition-colors duration-1000">
      <ScrollReveal>
        <div className="section-container">
          <div className="section-content">
            <h2 className="section-title">{title}</h2>
            <p className="section-description">{description}</p>
          </div>

          <div className="cards-grid">
            <div className="grid auto-rows-fr grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-2">
              {GRID_FEATURES.map((feature: GridFeature, index: number) => {
                const isActive = hoveredIndex === index;
                const featureTitle = t(feature.titleKey);
                const featureDescription = t(feature.descriptionKey);

                return (
                  <div
                    key={`grid-feature-${index}`}
                    className="flex flex-col gap-5 sm:flex-row"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="icon-box-primary">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>

                    <div className="flex-1">
                      <PointerHighlight active={isActive}>
                        <h3 className="text-foreground w-fit text-lg leading-8 font-semibold">
                          {featureTitle}
                        </h3>
                      </PointerHighlight>

                      <p className="text-muted-foreground mt-1 text-base leading-7">
                        {featureDescription}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
};

export default FeaturesGrid;
