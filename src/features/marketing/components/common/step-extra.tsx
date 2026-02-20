'use client';

import { useTranslations } from 'next-intl';

import { CopyableLink } from '@/features/marketing/components/common/copyable-link';
import type { MessageKey } from '@/i18n/types';

interface StepExtraProps {
  type: 'example' | 'questions' | 'share' | 'stats';
  stepKey: string;
}

const StepExtra = ({ type, stepKey }: StepExtraProps) => {
  const t = useTranslations();
  const baseKey = `marketing.howItWorks.steps.${stepKey}`;

  if (type === 'example') {
    const exampleTitle = t(`${baseKey}.exampleTitle` as MessageKey);
    const exampleDescription = t(`${baseKey}.exampleDescription` as MessageKey);

    return (
      <div className="card-static mt-6 text-left text-sm">
        <div className="flex items-center gap-2 font-medium">
          <div className="size-2 rounded-full bg-emerald-500" />
          {exampleTitle}
        </div>

        <p className="text-muted-foreground mt-2 leading-relaxed">{exampleDescription}</p>
      </div>
    );
  }

  if (type === 'questions') {
    const question1 = t(`${baseKey}.question1` as MessageKey);
    const question2 = t(`${baseKey}.question2` as MessageKey);

    return (
      <div className="mt-6 flex flex-col gap-3">
        <div className="card-static p-3 text-sm">{question1}</div>
        <div className="card-static p-3 text-sm">{question2}</div>
      </div>
    );
  }

  if (type === 'share') {
    return <CopyableLink link="painpoint.studio/r/dev-productivity-2025" />;
  }

  if (type === 'stats') {
    const responsesLabel = t(`${baseKey}.responsesLabel` as MessageKey);
    const painPointsLabel = t(`${baseKey}.painPointsLabel` as MessageKey);

    return (
      <div className="mt-6 flex flex-col gap-3">
        <div className="card-static flex items-center justify-between">
          <span className="text-sm font-medium">{responsesLabel}</span>
          <span className="text-xl font-bold">23</span>
        </div>

        <div className="card-static flex items-center justify-between">
          <span className="text-sm font-medium">{painPointsLabel}</span>
          <span className="text-xl font-bold">5</span>
        </div>
      </div>
    );
  }

  return null;
};

export { StepExtra };
