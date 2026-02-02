'use client';

import { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card';

interface FeatureCardProps {
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
}

const FeatureCard = ({ titleKey, descriptionKey, icon: Icon }: FeatureCardProps) => {
  const t = useTranslations();

  const title = t(titleKey);
  const description = t(descriptionKey);

  return (
    <CardContainer containerClassName="h-full py-0" className="h-full w-full">
      <CardBody className="card-interactive group/card flex h-full w-full flex-col items-start gap-6">
        <CardItem
          translateZ="50"
          className="bg-primary text-primary-foreground flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </CardItem>

        <div className="flex flex-col gap-4">
          <CardItem as="h3" translateZ="60" className="text-xl font-bold tracking-tight">
            {title}
          </CardItem>
          <CardItem
            as="p"
            translateZ="40"
            className="text-muted-foreground text-base leading-relaxed"
          >
            {description}
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  );
};

export default FeatureCard;
