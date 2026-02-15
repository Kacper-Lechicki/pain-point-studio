'use client';

import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface TextPreviewEditorProps {
  config: Record<string, unknown>;
  variant: 'short' | 'long';
}

export function TextPreviewEditor({ config, variant }: TextPreviewEditorProps) {
  const t = useTranslations();
  const placeholder = (config.placeholder as string) || t('surveys.builder.defaultTextPlaceholder');

  if (variant === 'long') {
    return (
      <Textarea
        disabled
        placeholder={placeholder}
        className="min-h-[100px] resize-none opacity-60"
        rows={4}
      />
    );
  }

  return <Input disabled placeholder={placeholder} className="opacity-60" />;
}
