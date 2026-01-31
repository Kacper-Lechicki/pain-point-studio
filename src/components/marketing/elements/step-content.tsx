import { cn } from '@/lib/utils';

interface StepContentProps {
  id: number;
  title: string;
  description: string;
  isReversed?: boolean | undefined;
  children?: React.ReactNode;
}

const StepContent = ({ id, title, description, isReversed, children }: StepContentProps) => {
  return (
    <div className={cn('flex flex-col gap-6', !isReversed && 'lg:text-right')}>
      <div
        className={cn(
          'flex flex-col gap-4',
          'lg:w-full lg:flex-row lg:items-center lg:justify-between',
          isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'
        )}
      >
        <div className="bg-foreground text-background flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
          {id}
        </div>

        <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
      </div>

      <div>
        <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">{description}</p>
      </div>

      {children}
    </div>
  );
};

export default StepContent;
