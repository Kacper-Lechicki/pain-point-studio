'use client';

import { Input } from '@/components/ui/input';

interface ShortTextQuestionProps {
  value: string;
  config: Record<string, unknown>;
  onChange: (value: { text: string }) => void;
}

export const ShortTextQuestion = ({ value, config, onChange }: ShortTextQuestionProps) => {
  const placeholder = (config.placeholder as string) || '';
  const maxLength = (config.maxLength as number) || 500;

  return (
    <div>
      <Input
        value={value}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={placeholder}
        maxLength={maxLength}
      />
      {maxLength && (
        <p className="text-muted-foreground mt-1.5 text-right text-xs">
          {value.length} / {maxLength}
        </p>
      )}
    </div>
  );
};
