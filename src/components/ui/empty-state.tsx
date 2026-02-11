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
    <div className="border-border flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
      <div className="bg-accent text-accent-foreground mb-4 flex size-12 items-center justify-center rounded-lg">
        <Icon className="size-6" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export { EmptyState };
