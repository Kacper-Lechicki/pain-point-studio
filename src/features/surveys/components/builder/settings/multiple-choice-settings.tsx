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
import { QUESTION_OPTIONS_MAX, SELECTION_MIN } from '@/features/surveys/config';

const MAX_SELECTIONS_OPTIONS = Array.from(
  { length: QUESTION_OPTIONS_MAX - SELECTION_MIN + 1 },
  (_, i) => SELECTION_MIN + i
);

export function MultipleChoiceSettings({ config, onUpdate }: SettingsProps) {
  const t = useTranslations();

  const maxSelections = (config.maxSelections as number) ?? SELECTION_MIN;
  const allowOther = (config.allowOther as boolean) ?? false;

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1 block text-xs">
          {t('surveys.builder.typeSettings.maxSelections')}
        </Label>
        <Select
          value={String(maxSelections)}
          onValueChange={(val) => onUpdate({ maxSelections: Number(val) })}
        >
          <SelectTrigger className="h-8 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MAX_SELECTIONS_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
