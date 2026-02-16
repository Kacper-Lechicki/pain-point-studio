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
import { TEXT_PLACEHOLDER_MAX_LENGTH } from '@/features/surveys/config';

const MAX_LENGTH_OPTIONS = [100, 200, 500, 1000, 2000, 5000, 10_000] as const;

/** Sentinel string used in the Select to represent "no limit". */
const NO_LIMIT = 'none';

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
          maxLength={TEXT_PLACEHOLDER_MAX_LENGTH}
          className="h-8"
        />
      </div>
      <div>
        <Label className="mb-1 block text-xs">{t('surveys.builder.typeSettings.maxLength')}</Label>
        <Select
          value={maxLength !== undefined ? String(maxLength) : NO_LIMIT}
          onValueChange={(val) =>
            onUpdate({ maxLength: val === NO_LIMIT ? undefined : Number(val) })
          }
        >
          <SelectTrigger className="h-8 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_LIMIT}>{t('surveys.builder.typeSettings.noLimit')}</SelectItem>
            {MAX_LENGTH_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n.toLocaleString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
