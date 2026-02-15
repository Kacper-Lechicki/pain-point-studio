import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { SettingsProps } from './types';

export function TextSettings({ config, onUpdate }: SettingsProps) {
  const t = useTranslations();

  const placeholder = (config.placeholder as string) ?? '';
  const maxLength = (config.maxLength as number) ?? undefined;

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1 block text-xs">
          {t('surveys.builder.typeSettings.placeholder')}
        </Label>
        <Input
          value={placeholder}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
          maxLength={200}
          className="h-8"
        />
      </div>
      <div>
        <Label className="mb-1 block text-xs">{t('surveys.builder.typeSettings.maxLength')}</Label>
        <Input
          type="number"
          min={1}
          value={maxLength ?? ''}
          onChange={(e) =>
            onUpdate({
              maxLength: e.target.value === '' ? undefined : Number(e.target.value),
            })
          }
          className="h-8"
        />
      </div>
    </div>
  );
}
