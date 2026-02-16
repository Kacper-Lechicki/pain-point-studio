'use client';

import { useTranslations } from 'next-intl';

import { ClipboardInput } from '@/components/ui/clipboard-input';

interface CopyableLinkProps {
  link: string;
}

export const CopyableLink = ({ link }: CopyableLinkProps) => {
  const t = useTranslations();

  return (
    <div className="bg-card text-card-foreground mt-6 rounded-lg border p-4 text-left shadow-sm">
      <label
        htmlFor="research-link"
        className="text-muted-foreground mb-2 block text-xs font-semibold tracking-wider"
      >
        {t('marketing.components.copyableLink.label')}
      </label>

      <ClipboardInput
        id="research-link"
        value={link}
        copyLabel={t('marketing.components.copyableLink.copy')}
        copiedLabel={t('marketing.components.copyableLink.copied')}
      />
    </div>
  );
};
