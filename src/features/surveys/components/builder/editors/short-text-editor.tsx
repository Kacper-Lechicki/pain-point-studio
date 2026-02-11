'use client';

import { Input } from '@/components/ui/input';

interface ShortTextEditorProps {
  config: Record<string, unknown>;
}

export function ShortTextEditor({ config }: ShortTextEditorProps) {
  const placeholder = (config.placeholder as string) || 'Type your answer here...';

  return <Input disabled placeholder={placeholder} className="opacity-60" />;
}
