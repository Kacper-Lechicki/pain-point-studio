import { LucideIcon } from 'lucide-react';

import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card';

interface ProblemCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const ProblemCard = ({ icon: Icon, title, description }: ProblemCardProps) => {
  return (
    <CardContainer containerClassName="h-full py-0" className="h-full w-full">
      <CardBody className="bg-card text-card-foreground group/card hover:shadow-primary/5 flex h-full w-full flex-col items-start rounded-2xl border p-8 transition-all hover:shadow-2xl">
        <CardItem
          translateZ="50"
          className="bg-primary/10 ring-ring/10 flex h-12 w-12 items-center justify-center rounded-lg ring-1"
        >
          <Icon className="text-primary h-6 w-6" aria-hidden="true" />
        </CardItem>

        <CardItem
          as="dt"
          translateZ="60"
          className="mt-4 text-lg leading-7 font-semibold tracking-tight"
        >
          {title}
        </CardItem>
        <CardItem
          as="dd"
          translateZ="40"
          className="text-muted-foreground mt-2 text-base leading-7"
        >
          {description}
        </CardItem>
      </CardBody>
    </CardContainer>
  );
};

export default ProblemCard;
