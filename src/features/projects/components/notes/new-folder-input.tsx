'use client';

import { type KeyboardEvent, useCallback, useRef, useState } from 'react';

import { FolderPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/common/utils';

interface NewFolderInputProps {
  onCreate: (name: string) => Promise<string | null>;
}

export function NewFolderInput({ onCreate }: NewFolderInputProps) {
  const t = useTranslations('projects.detail.notes');
  const [isExpanded, setIsExpanded] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreate = useCallback(async () => {
    const name = value.trim();

    if (!name) {
      setIsExpanded(false);

      return;
    }

    await onCreate(name);
    setValue('');
    setIsExpanded(false);
  }, [value, onCreate]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void handleCreate();
      } else if (e.key === 'Escape') {
        setValue('');
        setIsExpanded(false);
      }
    },
    [handleCreate]
  );

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleBlur = useCallback(() => {
    if (!value.trim()) {
      setIsExpanded(false);
    } else {
      void handleCreate();
    }
  }, [value, handleCreate]);

  if (!isExpanded) {
    return (
      <Button variant="ghost" size="icon-xs" onClick={handleExpand} aria-label={t('newFolder')}>
        <FolderPlus className="size-3.5" />
      </Button>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder={t('folderNamePlaceholder')}
      className={cn(
        'bg-accent/50 w-28 rounded px-1.5 py-0.5 text-xs outline-none',
        'placeholder:text-muted-foreground',
        'focus:ring-ring/50 focus:ring-1'
      )}
      onClick={(e) => e.stopPropagation()}
    />
  );
}
