'use client';

import { useTranslations } from 'next-intl';

import { Textarea } from '@/components/ui/textarea';

interface OpenTextEditorProps {
  config: Record<string, unknown>;
}

export function OpenTextEditor({ config }: OpenTextEditorProps) {
  const t = useTranslations('surveys.builder');
  const placeholder = (config.placeholder as string) || t('defaultTextPlaceholder');

  return (
    <Textarea
      disabled
      placeholder={placeholder}
      className="min-h-[160px] resize-none opacity-60"
      rows={6}
    />
  );
}
