import { ArrowLeft } from 'lucide-react';

import Link from '@/i18n/link';
import { cn } from '@/lib/common/utils';

interface BackButtonProps {
  href: string;
  label: string;
  className?: string;
}

const BackButton = ({ href, label, className }: BackButtonProps) => {
  return (
    <Link
      href={href}
      className={cn(
        'text-muted-foreground md:hover:text-foreground inline-flex min-h-10 min-w-10 touch-manipulation items-center gap-2 text-base transition-colors md:text-sm',
        className
      )}
    >
      <ArrowLeft className="size-5 shrink-0 md:size-4" aria-hidden="true" />
      {label}
    </Link>
  );
};

export { BackButton };
