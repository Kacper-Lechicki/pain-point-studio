'use client';

import { useTranslations } from 'next-intl';

import { Textarea } from '@/components/ui/textarea';

interface OpenTextEditorProps {
  config: Record<string, unknown>;
}

export function OpenTextEditor({ config }: OpenTextEditorProps) {
  const t = useTranslations();
  const placeholder = (config.placeholder as string) || t('surveys.builder.defaultTextPlaceholder');

  return (
    <Textarea
      disabled
      placeholder={placeholder}
      className="min-h-[160px] resize-none opacity-60"
      rows={6}
    />
  );
}
