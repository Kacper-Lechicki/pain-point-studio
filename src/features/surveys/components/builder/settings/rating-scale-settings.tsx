import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RATING_SCALE_MAX, RATING_SCALE_MIN } from '@/features/surveys/config';

import type { SettingsProps } from './types';

export function RatingScaleSettings({ config, onUpdate }: SettingsProps) {
  const t = useTranslations();

  const min = (config.min as number) ?? RATING_SCALE_MIN;
  const max = (config.max as number) ?? 5;
  const minLabel = (config.minLabel as string) ?? '';
  const maxLabel = (config.maxLabel as string) ?? '';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="mb-1 block text-xs">{t('surveys.builder.typeSettings.scaleMin')}</Label>
          <Input
            type="number"
            min={RATING_SCALE_MIN}
            max={max - 1}
            value={min}
            onChange={(e) => onUpdate({ min: Number(e.target.value) })}
            className="h-8"
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">{t('surveys.builder.typeSettings.scaleMax')}</Label>
          <Input
            type="number"
            min={min + 1}
            max={RATING_SCALE_MAX}
            value={max}
            onChange={(e) => onUpdate({ max: Number(e.target.value) })}
            className="h-8"
          />
        </div>
      </div>
      <div>
        <Label className="mb-1 block text-xs">{t('surveys.builder.typeSettings.minLabel')}</Label>
        <Input
          value={minLabel}
          onChange={(e) => onUpdate({ minLabel: e.target.value })}
          placeholder={t('surveys.builder.typeSettings.minLabelPlaceholder')}
          maxLength={100}
          className="h-8"
        />
      </div>
      <div>
        <Label className="mb-1 block text-xs">{t('surveys.builder.typeSettings.maxLabel')}</Label>
        <Input
          value={maxLabel}
          onChange={(e) => onUpdate({ maxLabel: e.target.value })}
          placeholder={t('surveys.builder.typeSettings.maxLabelPlaceholder')}
          maxLength={100}
          className="h-8"
        />
      </div>
    </div>
  );
}
