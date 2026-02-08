'use client';

import { useTranslations } from 'next-intl';

import { StepContent } from '@/features/marketing/components/common/step-content';
import { StepExtra } from '@/features/marketing/components/common/step-extra';
import { StepVisual } from '@/features/marketing/components/common/step-visual';
import { HowItWorksStep } from '@/features/marketing/config';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

interface StepCardProps {
  step: HowItWorksStep;
  isReversed?: boolean;
}

const StepCard = ({ step, isReversed }: StepCardProps) => {
  const t = useTranslations();
  const baseKey = `marketing.howItWorks.steps.${step.stepKey}`;

  const title = t(`${baseKey}.title` as MessageKey);
  const description = t(`${baseKey}.description` as MessageKey);
  const visualLabel = t(`${baseKey}.visualLabel` as MessageKey);

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

export { StepCard };
