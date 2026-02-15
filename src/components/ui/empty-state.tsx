import type { ReactNode } from 'react';

import type { LucideIcon } from 'lucide-react';

import { HeroHighlight } from '@/components/ui/hero-highlight';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => {
  return (
    <HeroHighlight
      showDotsOnMobile={false}
      containerClassName="border-border w-full rounded-lg border border-dashed"
    >
      <div className="flex w-full flex-col items-center px-8 py-16 text-center sm:px-10 md:py-20">
        <div className="text-muted-foreground mb-4 flex size-10 items-center justify-center">
          <Icon className="size-10" aria-hidden />
        </div>

        <h3 className="text-base font-semibold">{title}</h3>

        <p className="text-muted-foreground mt-1.5 max-w-sm text-sm leading-relaxed">
          {description}
        </p>

        {action && <div className="mt-6">{action}</div>}
      </div>
    </HeroHighlight>
  );
};

export { EmptyState };
