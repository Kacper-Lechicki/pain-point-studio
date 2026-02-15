import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { QUESTION_OPTIONS_MAX } from '@/features/surveys/config';

import type { SettingsProps } from './types';

export function MultipleChoiceSettings({ config, onUpdate }: SettingsProps) {
  const t = useTranslations();

  const minSelections = (config.minSelections as number) ?? undefined;
  const maxSelections = (config.maxSelections as number) ?? undefined;
  const allowOther = (config.allowOther as boolean) ?? false;
  const options = (config.options as string[]) ?? [];

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1 block text-xs">
          {t('surveys.builder.typeSettings.minSelections')}
        </Label>
        <Input
          type="number"
          min={1}
          max={options.length}
          value={minSelections ?? ''}
          onChange={(e) =>
            onUpdate({
              minSelections: e.target.value === '' ? undefined : Number(e.target.value),
            })
          }
          className="h-8"
        />
      </div>
      <div>
        <Label className="mb-1 block text-xs">
          {t('surveys.builder.typeSettings.maxSelections')}
        </Label>
        <Input
          type="number"
          min={1}
          max={QUESTION_OPTIONS_MAX}
          value={maxSelections ?? ''}
          onChange={(e) =>
            onUpdate({
              maxSelections: e.target.value === '' ? undefined : Number(e.target.value),
            })
          }
          className="h-8"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">{t('surveys.builder.typeSettings.allowOther')}</Label>
        <Switch
          checked={allowOther}
          onCheckedChange={(checked) => onUpdate({ allowOther: checked })}
        />
      </div>
    </div>
  );
}
