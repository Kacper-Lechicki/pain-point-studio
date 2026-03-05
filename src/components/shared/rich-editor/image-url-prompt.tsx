'use client';

import { type KeyboardEvent, useEffect, useRef, useState } from 'react';

import { ImageIcon, X } from 'lucide-react';

interface ImageUrlPromptProps {
  position: { top: number; left: number };
  onConfirm: (url: string) => void;
  onCancel: () => void;
}

export function ImageUrlPrompt({ position, onConfirm, onCancel }: ImageUrlPromptProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onCancel();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  function handleConfirm() {
    const trimmed = url.trim();

    if (!trimmed) {
      setError('URL is required');

      return;
    }

    try {
      new URL(trimmed);
    } catch {
      setError('Invalid URL');

      return;
    }

    onConfirm(trimmed);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <div
      ref={containerRef}
      className="bg-popover text-popover-foreground fixed z-50 flex w-80 flex-col gap-2 rounded-md border p-3 shadow-md"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex items-center gap-2">
        <ImageIcon className="text-muted-foreground size-4 shrink-0" />
        <span className="text-sm font-medium">Insert Image</span>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground md:hover:text-foreground ml-auto rounded-sm p-0.5 transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <input
        ref={inputRef}
        type="url"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          setError('');
        }}
        onKeyDown={handleKeyDown}
        placeholder="https://example.com/image.png"
        className="border-input bg-background focus:border-ring focus:ring-ring/50 h-8 rounded-md border px-2.5 text-sm shadow-xs outline-none focus:ring-[3px]"
      />

      {error && <p className="text-destructive text-xs">{error}</p>}

      <div className="flex justify-end gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground md:hover:bg-secondary h-7 rounded-md px-2.5 text-xs font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="bg-primary text-primary-foreground md:hover:bg-primary/90 h-7 rounded-md px-2.5 text-xs font-medium transition-colors"
        >
          Insert
        </button>
      </div>
    </div>
  );
}
