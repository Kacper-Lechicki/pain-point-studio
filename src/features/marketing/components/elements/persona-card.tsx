'use client';

import { Check, LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card';

interface PersonaCardProps {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  featuresKey: string;
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
          className="bg-muted flex h-14 w-14 items-center justify-center rounded-full"
        >
          <Icon className="text-foreground h-7 w-7" aria-hidden="true" />
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
          {features.map((feature: string, index: number) => (
            <li key={`feature-${index}`} className="flex items-start gap-3 text-sm">
              <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </CardItem>
      </CardBody>
    </CardContainer>
  );
};

export default PersonaCard;
