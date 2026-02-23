import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import Link from '@/i18n/link';

export function OverviewSection({
  title,
  viewAllLabel,
  viewAllHref,
  showViewAll,
  children,
}: {
  title: string;
  viewAllLabel: string;
  viewAllHref: string;
  showViewAll: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>

        {showViewAll && (
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground -mr-2">
            <Link href={viewAllHref}>
              {viewAllLabel}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        )}
      </div>

      {children}
    </section>
  );
}
