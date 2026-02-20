'use client';

import { Check, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card';
import type { MessageKey } from '@/i18n/types';

interface PersonaCardProps {
  icon: LucideIcon;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  featuresKey: MessageKey;
}

const PersonaCard = ({ icon: Icon, titleKey, descriptionKey, featuresKey }: PersonaCardProps) => {
  const t = useTranslations();

  const title = t(titleKey);
  const description = t(descriptionKey);
  const features = t.raw(featuresKey) as string[];

  return (
    <CardContainer containerClassName="h-full py-0" className="h-full w-full">
      <CardBody className="card-interactive group/card flex h-full w-full flex-col">
        <CardItem
          translateZ="50"
          className="bg-muted flex size-14 items-center justify-center rounded-full"
        >
          <Icon className="text-foreground size-7" aria-hidden="true" />
        </CardItem>

        <CardItem translateZ="60" as="h3" className="mt-6 text-xl font-bold">
          {title}
        </CardItem>

        <CardItem
          translateZ="40"
          as="p"
          className="text-muted-foreground mt-4 flex-1 text-sm leading-relaxed"
        >
          {description}
        </CardItem>

        <CardItem translateZ="20" as="ul" className="mt-8 w-full space-y-3">
          {features.map((feature, index) => (
            <li key={`feature-${index}`} className="flex items-start gap-3 text-sm">
              <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </CardItem>
      </CardBody>
    </CardContainer>
  );
};

export { PersonaCard };
