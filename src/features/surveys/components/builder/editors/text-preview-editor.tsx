'use client';

import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface TextPreviewEditorProps {
  config: Record<string, unknown>;
  variant: 'short' | 'long';
}

export function TextPreviewEditor({ config, variant }: TextPreviewEditorProps) {
  const t = useTranslations('surveys.builder');
  const placeholder = (config.placeholder as string) || t('defaultTextPlaceholder');

  if (variant === 'long') {
    return (
      <Textarea
        disabled
        placeholder={placeholder}
        className="min-h-[160px] resize-none opacity-60"
        rows={6}
      />
    );
  }

  return <Input disabled placeholder={placeholder} className="opacity-60" />;
}
