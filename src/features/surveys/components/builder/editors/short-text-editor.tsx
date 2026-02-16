'use client';

import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';

interface ShortTextEditorProps {
  config: Record<string, unknown>;
}

export function ShortTextEditor({ config }: ShortTextEditorProps) {
  const t = useTranslations();
  const placeholder = (config.placeholder as string) || t('surveys.builder.defaultTextPlaceholder');

  return <Input disabled placeholder={placeholder} className="opacity-60" />;
}
