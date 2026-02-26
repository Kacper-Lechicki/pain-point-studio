import type { LucideIcon } from 'lucide-react';

interface OverviewMetricCardProps {
  value: string;
  label: string;
  icon: LucideIcon;
}

export function OverviewMetricCard({ value, label, icon: Icon }: OverviewMetricCardProps) {
  return (
    <div className="border-border/50 rounded-md border px-3 py-2.5">
      <div className="text-foreground text-lg leading-none font-semibold tabular-nums">{value}</div>
      <div className="text-muted-foreground mt-1.5 flex items-start gap-1 text-[11px]">
        <Icon className="mt-0.5 size-3 shrink-0" aria-hidden />
        {label}
      </div>
    </div>
  );
}
