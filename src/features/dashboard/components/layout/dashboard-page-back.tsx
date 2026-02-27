import { BackButton } from '@/components/ui/back-button';

interface DashboardPageBackProps {
  href: string;
  label: string;
}

export function DashboardPageBack({ href, label }: DashboardPageBackProps) {
  return (
    <div className="mb-2 flex h-9 items-center">
      <BackButton href={href} label={label} className="h-9 pl-0" />
    </div>
  );
}
