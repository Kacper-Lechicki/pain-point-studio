'use client';

import Link from '@/i18n/link';
import { cn } from '@/lib/common/utils';

const PERIODS = ['7', '30', '90'] as const;

const LABELS: Record<(typeof PERIODS)[number], string> = {
  '7': '7d',
  '30': '30d',
  '90': '90d',
};

interface DashboardTimeFilterProps {
  currentPeriod: string;
}

export function DashboardTimeFilter({ currentPeriod }: DashboardTimeFilterProps) {
  return (
    <div className="border-border/50 bg-card flex items-center gap-1.5 rounded-md border p-1 shadow-sm">
      {PERIODS.map((period) => (
        <Link
          key={period}
          href={`?period=${period}`}
          scroll={false}
          className={cn(
            'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
            currentPeriod === period
              ? 'bg-primary text-primary-foreground border-transparent shadow-sm'
              : 'text-muted-foreground md:hover:border-foreground/30 md:hover:text-foreground border-transparent md:hover:border-dashed'
          )}
        >
          {LABELS[period]}
        </Link>
      ))}
    </div>
  );
}
