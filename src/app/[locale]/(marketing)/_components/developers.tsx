'use client';

import { useTranslations } from 'next-intl';

import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { PersonaCard } from '@/features/marketing/components/common/persona-card';
import { DEVELOPER_PERSONAS } from '@/features/marketing/config';

const Developers = () => {
  const t = useTranslations();

  const title = t('marketing.personas.title');
  const description = t('marketing.personas.description');

  return (
    <section className="section-padding bg-section-alt border-t border-white/5 transition-colors duration-1000">
      <ScrollReveal>
        <div className="section-container">
          <div className="section-content">
            <h2 className="section-title">{title}</h2>
            <p className="section-description">{description}</p>
          </div>

          <div className="cards-grid">
            <div className="grid auto-rows-fr grid-cols-1 gap-8 lg:grid-cols-3">
              {DEVELOPER_PERSONAS.map((persona, index) => (
                <PersonaCard
                  key={`persona-${index}`}
                  icon={persona.icon}
                  titleKey={persona.titleKey}
                  descriptionKey={persona.descriptionKey}
                  featuresKey={persona.featuresKey}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
};

export default Developers;
