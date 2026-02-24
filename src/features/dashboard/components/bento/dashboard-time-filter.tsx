'use client';

import { useTranslations } from 'next-intl';

import Link from '@/i18n/link';
import { cn } from '@/lib/common/utils';

const PERIODS = ['7', '30', '90', '0'] as const;

interface DashboardTimeFilterProps {
  currentPeriod: string;
}

export function DashboardTimeFilter({ currentPeriod }: DashboardTimeFilterProps) {
  const t = useTranslations('dashboard.bento');

  const labels: Record<string, string> = {
    '7': '7d',
    '30': '30d',
    '90': '90d',
    '0': t('period.all'),
  };

  return (
    <div className="border-border/50 bg-card flex items-center gap-1.5 rounded-full border p-1 shadow-sm">
      {PERIODS.map((period) => (
        <Link
          key={period}
          href={`?period=${period}`}
          scroll={false}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            currentPeriod === period
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          )}
        >
          {labels[period]}
        </Link>
      ))}
    </div>
  );
}
