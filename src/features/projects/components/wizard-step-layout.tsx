import type { ReactNode } from 'react';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/common/utils';

const TOTAL_STEPS = 4;

interface WizardStepLayoutProps {
  stepNumber: number;
  title: string;
  hint: string;
  children: ReactNode;
  onNext: () => void;
  onBack?: (() => void) | undefined;
  nextLabel?: string | undefined;
  isLoading?: boolean | undefined;
  isNextDisabled?: boolean | undefined;
  /** When true the next button becomes type="submit" (for the final form step). */
  isSubmit?: boolean | undefined;
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div
      className="flex items-center gap-1.5"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={TOTAL_STEPS}
    >
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < current;
        const isCurrent = step === current;

        return (
          <div
            key={step}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              isCurrent ? 'bg-primary w-6' : 'w-1.5',
              isCompleted && 'bg-primary/60',
              !isCompleted && !isCurrent && 'bg-muted-foreground/50'
            )}
          />
        );
      })}
    </div>
  );
}

export function WizardStepLayout({
  stepNumber,
  title,
  hint,
  children,
  onNext,
  onBack,
  nextLabel,
  isLoading = false,
  isNextDisabled = false,
  isSubmit = false,
}: WizardStepLayoutProps) {
  const t = useTranslations('projects.create');

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <StepIndicator current={stepNumber} />
          <span className="text-muted-foreground text-xs">
            {t('stepIndicator', { current: stepNumber, total: TOTAL_STEPS })}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-muted-foreground text-sm">{hint}</p>
        </div>
      </div>

      {/* Content */}
      <div>{children}</div>

      {/* Navigation */}
      <div className="flex items-center justify-end gap-2">
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={isLoading}
            className="mr-auto"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t('navigation.back')}
          </Button>
        )}

        <Button
          type={isSubmit ? 'submit' : 'button'}
          onClick={isSubmit ? undefined : onNext}
          disabled={isNextDisabled || isLoading}
        >
          {isLoading && <Spinner />}
          {nextLabel ?? t('navigation.next')}
        </Button>
      </div>
    </div>
  );
}
