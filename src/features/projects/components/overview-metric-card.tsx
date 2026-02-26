import type { LucideIcon } from 'lucide-react';

interface OverviewMetricCardProps {
  value: string;
  label: string;
  icon: LucideIcon;
}

export function OverviewMetricCard({ value, label, icon: Icon }: OverviewMetricCardProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-md border p-3">
      <span className="text-foreground text-lg leading-none font-semibold tracking-tight">
        {value}
      </span>
      <div className="flex items-center gap-1">
        <Icon className="text-muted-foreground size-3 shrink-0" aria-hidden />
        <span className="text-muted-foreground text-[11px] font-medium">{label}</span>
      </div>
    </div>
  );
}
