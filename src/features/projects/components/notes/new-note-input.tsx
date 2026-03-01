'use client';

import { useCallback, useState } from 'react';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

interface NewNoteInputProps {
  onCreate: (title?: string, folderId?: string | null) => Promise<string | null>;
}

export function NewNoteInput({ onCreate }: NewNoteInputProps) {
  const t = useTranslations('projects.detail.notes');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    if (isCreating) {
      return;
    }

    setIsCreating(true);

    try {
      await onCreate();
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, onCreate]);

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={handleCreate}
      disabled={isCreating}
      aria-label={t('newNotePlaceholder')}
    >
      <Plus className="size-4" />
    </Button>
  );
}
