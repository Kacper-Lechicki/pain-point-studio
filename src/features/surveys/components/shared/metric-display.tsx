import type { ReactNode } from 'react';

export function MetricRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
        {Icon != null && <Icon className="size-3.5 shrink-0" aria-hidden />}
        {label}
      </span>
      <span className="text-foreground text-right text-xs font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wider uppercase">
      {children}
    </p>
  );
}
