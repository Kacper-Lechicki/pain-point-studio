'use client';

import { type KeyboardEvent, type RefObject, useRef, useState } from 'react';

import { FolderPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NewFolderState {
  isExpanded: boolean;
  expand: () => void;
  inputProps: {
    ref: RefObject<HTMLInputElement | null>;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (e: KeyboardEvent) => void;
    onBlur: () => void;
  };
}

export function useNewFolder(onCreate: (name: string) => Promise<string | null>): NewFolderState {
  const [isExpanded, setIsExpanded] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    const name = value.trim();

    if (!name) {
      setIsExpanded(false);

      return;
    }

    await onCreate(name);
    setValue('');
    setIsExpanded(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleCreate();
    } else if (e.key === 'Escape') {
      setValue('');
      setIsExpanded(false);
    }
  };

  const expand = () => {
    setIsExpanded(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleBlur = () => {
    if (!value.trim()) {
      setIsExpanded(false);
    } else {
      void handleCreate();
    }
  };

  return {
    isExpanded,
    expand,
    inputProps: {
      ref: inputRef,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value),
      onKeyDown: handleKeyDown,
      onBlur: handleBlur,
    },
  };
}

export function NewFolderButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations('projects.detail.notes');

  return (
    <Button variant="ghost" size="icon-xs" onClick={onClick} aria-label={t('newFolder')}>
      <FolderPlus className="size-3.5" />
    </Button>
  );
}

export function NewFolderField({ inputProps }: { inputProps: NewFolderState['inputProps'] }) {
  const t = useTranslations('projects.detail.notes');

  return (
    <div className="px-2.5 pb-1">
      <Input
        {...inputProps}
        type="text"
        placeholder={t('folderNamePlaceholder')}
        size="sm"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
