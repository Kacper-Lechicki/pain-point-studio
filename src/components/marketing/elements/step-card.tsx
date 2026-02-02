import StepContent from '@/components/marketing/elements/step-content';
import StepVisual from '@/components/marketing/elements/step-visual';
import { cn } from '@/lib/utils';

interface StepCardProps {
  step: {
    id: number;
    title: string;
    description: string;
    visualIcon: React.ElementType;
    visualLabel: string;
    visualChart?: React.ElementType;
    renderExtra?: () => React.ReactNode;
  };
  isReversed?: boolean;
}

const StepCard = ({ step, isReversed }: StepCardProps) => {
  const contentClass = cn('flex min-w-0 flex-col gap-6', isReversed && 'lg:order-last');
  const visualClass = cn('relative', isReversed && 'lg:order-first');

  return (
    <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:items-center">
      <div className={contentClass}>
        <StepContent
          id={step.id}
          title={step.title}
          description={step.description}
          isReversed={isReversed}
        >
          {step.renderExtra && step.renderExtra()}
        </StepContent>
      </div>

      <div className={visualClass}>
        <StepVisual icon={step.visualIcon} label={step.visualLabel} chart={step.visualChart} />
      </div>
    </div>
  );
};

export default StepCard;
