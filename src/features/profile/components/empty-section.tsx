import type { LucideIcon } from 'lucide-react';

interface EmptySectionProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

const EmptySection = ({ title, description, icon: Icon }: EmptySectionProps) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{title}</h3>

      <div className="bg-muted/10 hover:bg-muted/20 flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center transition-colors">
        {Icon && (
          <div className="bg-muted/50 flex size-10 items-center justify-center rounded-full">
            <Icon className="text-muted-foreground size-5" />
          </div>
        )}
        <p className="text-muted-foreground max-w-xs text-sm">{description}</p>
      </div>
    </div>
  );
};

export { EmptySection };
