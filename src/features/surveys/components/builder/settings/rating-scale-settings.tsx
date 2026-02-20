import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SettingsProps } from '@/features/surveys/components/builder/settings/types';
import {
  RATING_LABEL_MAX_LENGTH,
  RATING_SCALE_MAX,
  RATING_SCALE_MIN,
} from '@/features/surveys/config';

export function RatingScaleSettings({ config, onUpdate }: SettingsProps) {
  const t = useTranslations('surveys.builder.typeSettings');
  const min = (config.min as number) ?? RATING_SCALE_MIN;
  const max = (config.max as number) ?? 5;
  const minLabel = (config.minLabel as string) ?? '';
  const maxLabel = (config.maxLabel as string) ?? '';

  const minOptions = useMemo(
    () => Array.from({ length: max - RATING_SCALE_MIN }, (_, i) => RATING_SCALE_MIN + i),
    [max]
  );

  const maxOptions = useMemo(
    () => Array.from({ length: RATING_SCALE_MAX - min }, (_, i) => min + 1 + i),
    [min]
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="mb-1 block text-xs">{t('scaleMin')}</Label>

          <Select value={String(min)} onValueChange={(val) => onUpdate({ min: Number(val) })}>
            <SelectTrigger className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {minOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-1 block text-xs">{t('scaleMax')}</Label>

          <Select value={String(max)} onValueChange={(val) => onUpdate({ max: Number(val) })}>
            <SelectTrigger className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {maxOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="mb-1 block text-xs">{t('minLabel')}</Label>
        <Input
          value={minLabel}
          onChange={(e) => onUpdate({ minLabel: e.target.value })}
          placeholder={t('minLabelPlaceholder')}
          maxLength={RATING_LABEL_MAX_LENGTH}
          className="h-8"
        />
      </div>

      <div>
        <Label className="mb-1 block text-xs">{t('maxLabel')}</Label>
        <Input
          value={maxLabel}
          onChange={(e) => onUpdate({ maxLabel: e.target.value })}
          placeholder={t('maxLabelPlaceholder')}
          maxLength={RATING_LABEL_MAX_LENGTH}
          className="h-8"
        />
      </div>
    </div>
  );
}
