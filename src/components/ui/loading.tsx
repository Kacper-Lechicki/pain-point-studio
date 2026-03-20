import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/common/utils';

interface LoadingProps {
  className?: string;
  spinnerClassName?: string;
}

const Loading = ({ className, spinnerClassName }: LoadingProps) => {
  return (
    <div className={cn('flex w-full flex-1 items-center justify-center', className)}>
      <Spinner className={cn('size-8', spinnerClassName)} />
    </div>
  );
};

export { Loading };
