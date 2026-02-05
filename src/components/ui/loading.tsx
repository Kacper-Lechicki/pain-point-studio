import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/common/utils';

interface LoadingProps {
  className?: string;
  spinnerClassName?: string;
}

export function Loading({ className, spinnerClassName }: LoadingProps) {
  return (
    <div className={cn('flex min-h-[50vh] w-full items-center justify-center', className)}>
      <Spinner className={cn('size-8', spinnerClassName)} />
    </div>
  );
}
