import { Check, LucideIcon } from 'lucide-react';

interface PersonaCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
}

const PersonaCard = ({ icon: Icon, title, description, features }: PersonaCardProps) => {
  return (
    <div className="bg-card text-card-foreground hover:bg-accent/50 group flex flex-col rounded-2xl border p-8 shadow-sm transition-all">
      <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
        <Icon className="text-foreground h-7 w-7" />
      </div>

      <h3 className="mt-6 text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground mt-4 flex-1 text-sm leading-relaxed">{description}</p>

      <ul className="mt-8 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PersonaCard;
