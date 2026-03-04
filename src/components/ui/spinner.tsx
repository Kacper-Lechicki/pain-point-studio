import { cn } from '@/lib/common/utils';

interface SpinnerProps {
  className?: string;
  'aria-label'?: string;
}

const Spinner = ({ className, 'aria-label': ariaLabel = 'Loading' }: SpinnerProps) => {
  return (
    <div
      className={cn(
        'size-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className
      )}
      role="status"
      aria-label={ariaLabel}
    />
  );
};

export { Spinner };
