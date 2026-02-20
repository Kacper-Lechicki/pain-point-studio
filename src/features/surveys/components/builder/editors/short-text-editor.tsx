'use client';

import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';

interface ShortTextEditorProps {
  config: Record<string, unknown>;
}

export function ShortTextEditor({ config }: ShortTextEditorProps) {
  const t = useTranslations('surveys.builder');
  const placeholder = (config.placeholder as string) || t('defaultTextPlaceholder');

  return <Input disabled placeholder={placeholder} className="opacity-60" />;
}
