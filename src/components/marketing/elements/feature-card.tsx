import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

const FeatureCard = ({ title, description, icon: Icon }: FeatureCardProps) => {
  return (
    <div className="bg-card text-card-foreground flex flex-col items-start gap-6 rounded-2xl border p-8 shadow-sm">
      <div className="bg-primary text-primary-foreground flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>

      <div>
        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        <p className="text-muted-foreground mt-4 text-base leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

export default FeatureCard;
