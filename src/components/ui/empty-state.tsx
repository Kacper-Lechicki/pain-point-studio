import type { ReactNode } from 'react';

import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="bg-card border-border flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-14 text-center">
      <div className="bg-accent text-accent-foreground mb-3 flex size-10 items-center justify-center rounded-lg">
        <Icon className="size-5" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1 max-w-xs text-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export { EmptyState };
