import { StepContent } from '@/features/marketing/components/common/step-content';
import { StepExtra } from '@/features/marketing/components/common/step-extra';
import { StepVisual } from '@/features/marketing/components/common/step-visual';
import type { HowItWorksStep } from '@/features/marketing/config';
import { cn } from '@/lib/common/utils';

interface StepCardTranslations {
  title: string;
  description: string;
  visualLabel: string;
}

interface StepCardProps {
  step: HowItWorksStep;
  isReversed?: boolean;
  translations: StepCardTranslations;
}

const StepCard = ({ step, isReversed, translations }: StepCardProps) => {
  const contentClass = cn('flex min-w-0 flex-col gap-6', isReversed && 'lg:order-last');
  const visualClass = cn('relative', isReversed && 'lg:order-first');

  return (
    <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:items-center">
      <div className={contentClass}>
        <StepContent
          id={step.id}
          title={translations.title}
          description={translations.description}
          isReversed={isReversed}
        >
          {step.extraType && <StepExtra type={step.extraType} stepKey={step.stepKey} />}
        </StepContent>
      </div>

      <div className={visualClass}>
        <StepVisual
          icon={step.visualIcon}
          label={translations.visualLabel}
          chart={step.visualChart}
        />
      </div>
    </div>
  );
};

export { StepCard };
