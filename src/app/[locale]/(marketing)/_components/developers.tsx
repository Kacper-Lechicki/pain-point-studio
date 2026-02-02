'use client';

import { useTranslations } from 'next-intl';

import PersonaCard from '@/components/marketing/elements/persona-card';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { DEVELOPER_PERSONAS, DeveloperPersona } from '@/config/marketing';

const Developers = () => {
  const t = useTranslations();

  const title = t('Marketing.developers.title');
  const description = t('Marketing.developers.description');

  return (
    <section className="section-padding border-t border-white/5 bg-[#1a1a1a] transition-colors duration-1000">
      <ScrollReveal>
        <div className="section-container">
          <div className="section-content">
            <h2 className="section-title">{title}</h2>
            <p className="section-description">{description}</p>
          </div>

          <div className="cards-grid">
            <div className="grid auto-rows-fr grid-cols-1 gap-8 lg:grid-cols-3">
              {DEVELOPER_PERSONAS.map((persona: DeveloperPersona, index: number) => (
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
