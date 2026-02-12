'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  OPEN_TEXT_DEFAULT_MAX_LENGTH,
  SHORT_TEXT_DEFAULT_MAX_LENGTH,
} from '@/features/surveys/config';

interface TextQuestionProps {
  value: string;
  config: Record<string, unknown>;
  variant: 'short' | 'long';
  onChange: (value: { text: string }) => void;
}

const DEFAULT_MAX_LENGTH = {
  short: SHORT_TEXT_DEFAULT_MAX_LENGTH,
  long: OPEN_TEXT_DEFAULT_MAX_LENGTH,
} as const;

export const TextQuestion = ({ value, config, variant, onChange }: TextQuestionProps) => {
  const placeholder = (config.placeholder as string) || '';
  const maxLength = (config.maxLength as number) || DEFAULT_MAX_LENGTH[variant];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ text: e.target.value });

  return (
    <div>
      {variant === 'long' ? (
        <Textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={6}
          className="resize-none"
        />
      ) : (
        <Input
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
        />
      )}
      {maxLength && (
        <p className="text-muted-foreground mt-1.5 text-right text-xs">
          {value.length} / {maxLength}
        </p>
      )}
    </div>
  );
};
