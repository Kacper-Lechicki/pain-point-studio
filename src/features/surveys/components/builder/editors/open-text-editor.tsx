'use client';

import { Textarea } from '@/components/ui/textarea';

interface OpenTextEditorProps {
  config: Record<string, unknown>;
}

export function OpenTextEditor({ config }: OpenTextEditorProps) {
  const placeholder = (config.placeholder as string) || 'Type your answer here...';

  return (
    <Textarea
      disabled
      placeholder={placeholder}
      className="min-h-[100px] resize-none opacity-60"
      rows={4}
    />
  );
}
