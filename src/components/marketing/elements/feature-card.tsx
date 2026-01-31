import { LucideIcon } from 'lucide-react';

import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

const FeatureCard = ({ title, description, icon: Icon }: FeatureCardProps) => {
  return (
    <CardContainer containerClassName="h-full py-0" className="h-full w-full">
      <CardBody className="bg-card text-card-foreground group/card hover:shadow-primary/5 flex h-full w-full flex-col items-start gap-6 rounded-2xl border p-8 shadow-sm transition-all hover:shadow-2xl">
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
