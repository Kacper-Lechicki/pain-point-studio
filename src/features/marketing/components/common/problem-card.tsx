'use client';

import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card';

interface ProblemCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const ProblemCard = ({ icon, title, description }: ProblemCardProps) => {
  return (
    <CardContainer containerClassName="h-full py-0" className="h-full w-full">
      <CardBody className="card-interactive group/card flex h-full w-full flex-col items-start">
        <CardItem
          translateZ="50"
          className="bg-primary/10 ring-ring/10 flex size-12 items-center justify-center rounded-lg ring-1"
        >
          {icon}
        </CardItem>

        <CardItem
          as="h3"
          translateZ="60"
          className="mt-4 text-lg leading-7 font-semibold tracking-tight"
        >
          {title}
        </CardItem>

        <CardItem as="p" translateZ="40" className="text-muted-foreground mt-2 text-base leading-7">
          {description}
        </CardItem>
      </CardBody>
    </CardContainer>
  );
};

export { ProblemCard };
