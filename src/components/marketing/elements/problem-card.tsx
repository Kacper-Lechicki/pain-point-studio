import { LucideIcon } from 'lucide-react';

interface ProblemCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const ProblemCard = ({ icon: Icon, title, description }: ProblemCardProps) => {
  return (
    <div className="bg-card text-card-foreground hover:bg-accent/50 group flex flex-col items-start rounded-2xl border p-8 transition-colors">
      <div className="bg-primary/10 ring-ring/10 flex h-12 w-12 items-center justify-center rounded-lg ring-1">
        <Icon className="text-primary h-6 w-6" aria-hidden="true" />
      </div>

      <dt className="mt-4 text-lg leading-7 font-semibold tracking-tight">{title}</dt>
      <dd className="text-muted-foreground mt-2 text-base leading-7">{description}</dd>
    </div>
  );
};

export default ProblemCard;
