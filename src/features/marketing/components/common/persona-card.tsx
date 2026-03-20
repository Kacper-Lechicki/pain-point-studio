'use client';

import { Check } from 'lucide-react';

import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card';

interface PersonaCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

const PersonaCard = ({ icon, title, description, features }: PersonaCardProps) => {
  return (
    <CardContainer containerClassName="h-full py-0" className="h-full w-full">
      <CardBody className="card-interactive group/card flex h-full w-full flex-col">
        <CardItem
          translateZ="50"
          className="bg-muted flex size-14 items-center justify-center rounded-full"
        >
          {icon}
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
