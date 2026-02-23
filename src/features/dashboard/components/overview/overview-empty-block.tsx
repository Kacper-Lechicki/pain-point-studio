import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import Link from '@/i18n/link';

export function OverviewEmptyBlock({
  message,
  ctaLabel,
  ctaHref,
}: {
  message: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="border-border/50 flex flex-col items-center gap-3 rounded-lg border border-dashed py-8 text-center">
      <p className="text-muted-foreground text-sm">{message}</p>

      <Button variant="outline" size="sm" asChild>
        <Link href={ctaHref}>
          <Plus className="size-3.5" aria-hidden />
          {ctaLabel}
        </Link>
      </Button>
    </div>
  );
}
