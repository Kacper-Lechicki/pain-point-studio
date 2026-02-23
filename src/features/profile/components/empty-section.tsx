import type { LucideIcon } from 'lucide-react';

import { HeroHighlight } from '@/components/ui/hero-highlight';

interface EmptySectionProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

const EmptySection = ({ title, description, icon: Icon }: EmptySectionProps) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{title}</h3>

      <HeroHighlight
        showDotsOnMobile={false}
        containerClassName="w-full rounded-lg border border-dashed border-border"
      >
        <div className="flex w-full flex-col items-center gap-3 px-4 py-10 text-center md:py-12">
          {Icon && (
            <div className="bg-muted/50 flex size-10 items-center justify-center rounded-full">
              <Icon className="text-muted-foreground size-5" />
            </div>
          )}

          <p className="text-muted-foreground max-w-xs text-sm">{description}</p>
        </div>
      </HeroHighlight>
    </div>
  );
};

export { EmptySection };
