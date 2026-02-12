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
    <div className="border-border flex w-full flex-col items-center rounded-lg border border-dashed px-8 py-12 text-center sm:px-10 md:py-16">
      <div className="text-muted-foreground mb-4 flex size-10 items-center justify-center">
        <Icon className="size-10" aria-hidden />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1.5 max-w-md text-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export { EmptyState };
