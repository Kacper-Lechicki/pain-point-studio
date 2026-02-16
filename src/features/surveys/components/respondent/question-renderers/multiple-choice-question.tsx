'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/common/utils';

interface MultipleChoiceQuestionProps {
  value: { selected: string[]; other?: string | null };
  config: Record<string, unknown>;
  onChange: (value: { selected: string[]; other?: string | null }) => void;
}

export const MultipleChoiceQuestion = ({
  value,
  config,
  onChange,
}: MultipleChoiceQuestionProps) => {
  const t = useTranslations();

  const options = (config.options as string[]) ?? [];
  const maxSelections = (config.maxSelections as number) || options.length;
  const allowOther = (config.allowOther as boolean) ?? false;
  const isSingleSelect = maxSelections === 1;

  const handleToggle = (option: string) => {
    if (isSingleSelect) {
      onChange({ ...value, selected: [option] });

      return;
    }

    const isSelected = value.selected.includes(option);

    if (isSelected) {
      onChange({ ...value, selected: value.selected.filter((s) => s !== option) });
    } else if (value.selected.length < maxSelections) {
      onChange({ ...value, selected: [...value.selected, option] });
    }
  };

  return (
    <div
      role={isSingleSelect ? 'radiogroup' : 'group'}
      aria-label={t('respondent.questions.choiceGroup')}
      className="space-y-2"
    >
      {options.map((option) => {
        const isSelected = value.selected.includes(option);

        return (
          <button
            key={option}
            type="button"
            role={isSingleSelect ? 'radio' : 'checkbox'}
            aria-checked={isSelected}
            onClick={() => handleToggle(option)}
            className={cn(
              'flex min-h-10 w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors md:min-h-9',
              isSelected
                ? 'border-primary bg-primary/5 text-foreground'
                : 'border-border text-foreground hover:bg-muted/50'
            )}
          >
            <div
              className={cn(
                'flex size-5 shrink-0 items-center justify-center border transition-colors',
                isSingleSelect ? 'rounded-full' : 'rounded',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/30'
              )}
            >
              {isSelected && <Check className="size-3" />}
            </div>
            <span>{option}</span>
          </button>
        );
      })}

      {allowOther && (
        <div className="pt-1">
          <Input
            value={value.other ?? ''}
            onChange={(e) => onChange({ ...value, other: e.target.value || null })}
            placeholder={t('respondent.questions.otherPlaceholder')}
            className="text-sm"
          />
        </div>
      )}
    </div>
  );
};
