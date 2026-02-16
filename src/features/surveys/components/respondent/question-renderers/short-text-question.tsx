'use client';

import { Input } from '@/components/ui/input';
import { SHORT_TEXT_DEFAULT_MAX_LENGTH } from '@/features/surveys/config';

import { CharacterCounter } from './character-counter';

interface ShortTextQuestionProps {
  value: string;
  config: Record<string, unknown>;
  onChange: (value: { text: string }) => void;
}

export const ShortTextQuestion = ({ value, config, onChange }: ShortTextQuestionProps) => {
  const placeholder = (config.placeholder as string) || '';
  const maxLength = (config.maxLength as number) || SHORT_TEXT_DEFAULT_MAX_LENGTH;

  return (
    <div>
      <Input
        value={value}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={placeholder}
        maxLength={maxLength}
      />
      <CharacterCounter current={value.length} max={maxLength} />
    </div>
  );
};
