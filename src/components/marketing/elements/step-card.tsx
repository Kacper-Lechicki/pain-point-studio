'use client';

import { useTranslations } from 'next-intl';

import StepContent from '@/components/marketing/elements/step-content';
import StepExtra from '@/components/marketing/elements/step-extra';
import StepVisual from '@/components/marketing/elements/step-visual';
import { HowItWorksStep } from '@/config/marketing';
import { cn } from '@/lib/utils';

interface StepCardProps {
  step: HowItWorksStep;
  isReversed?: boolean;
}

const StepCard = ({ step, isReversed }: StepCardProps) => {
  const t = useTranslations();
  const baseKey = `Marketing.howItWorks.steps.${step.stepKey}`;

  const title = t(`${baseKey}.title`);
  const description = t(`${baseKey}.description`);
  const visualLabel = t(`${baseKey}.visualLabel`);

  const contentClass = cn('flex min-w-0 flex-col gap-6', isReversed && 'lg:order-last');
  const visualClass = cn('relative', isReversed && 'lg:order-first');

  return (
    <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:items-center">
      <div className={contentClass}>
        <StepContent id={step.id} title={title} description={description} isReversed={isReversed}>
          {step.extraType && <StepExtra type={step.extraType} stepKey={step.stepKey} />}
        </StepContent>
      </div>

      <div className={visualClass}>
        <StepVisual icon={step.visualIcon} label={visualLabel} chart={step.visualChart} />
      </div>
    </div>
  );
};

export default StepCard;
