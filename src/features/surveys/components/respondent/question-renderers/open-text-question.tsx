'use client';

import { Textarea } from '@/components/ui/textarea';
import { CharacterCounter } from '@/features/surveys/components/respondent/question-renderers/character-counter';
import { OPEN_TEXT_DEFAULT_MAX_LENGTH } from '@/features/surveys/config';

interface OpenTextQuestionProps {
  value: string;
  config: Record<string, unknown>;
  onChange: (value: { text: string }) => void;
}

export const OpenTextQuestion = ({ value, config, onChange }: OpenTextQuestionProps) => {
  const placeholder = (config.placeholder as string) || '';
  const maxLength = (config.maxLength as number) || OPEN_TEXT_DEFAULT_MAX_LENGTH;

  return (
    <div>
      <Textarea
        value={value}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={6}
        className="resize-none"
      />
      <CharacterCounter current={value.length} max={maxLength} />
    </div>
  );
};
