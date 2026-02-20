import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { SettingsProps } from '@/features/surveys/components/builder/settings/types';
import { SELECTION_MIN } from '@/features/surveys/config';

export function MultipleChoiceSettings({ config, onUpdate }: SettingsProps) {
  const t = useTranslations('surveys.builder.typeSettings');
  const options = (config.options as string[]) ?? [];
  const allowOther = (config.allowOther as boolean) ?? false;
  const maxSelections = (config.maxSelections as number) ?? SELECTION_MIN;
  const availableChoices = options.length + (allowOther ? 1 : 0);
  const upperBound = Math.max(SELECTION_MIN, availableChoices);
  const clampedMax = Math.min(maxSelections, upperBound);

  const selectionsRange = useMemo(
    () => Array.from({ length: upperBound - SELECTION_MIN + 1 }, (_, i) => SELECTION_MIN + i),
    [upperBound]
  );

  const handleAllowOtherChange = (checked: boolean) => {
    const newAvailable = options.length + (checked ? 1 : 0);

    onUpdate({
      allowOther: checked,
      ...(maxSelections > newAvailable && { maxSelections: newAvailable }),
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1 block text-xs">{t('maxSelections')}</Label>

        <Select
          value={String(clampedMax)}
          onValueChange={(val) => onUpdate({ maxSelections: Number(val) })}
        >
          <SelectTrigger className="h-8 w-full">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {selectionsRange.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs">{t('allowOther')}</Label>
        <Switch checked={allowOther} onCheckedChange={handleAllowOtherChange} />
      </div>
    </div>
  );
}
