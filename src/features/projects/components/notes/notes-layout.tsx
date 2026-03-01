'use client';

import type { ReactNode } from 'react';

import { useBreakpoint } from '@/hooks/common/use-breakpoint';

interface NotesLayoutProps {
  sidebar: ReactNode;
  editor: ReactNode;
  showEditor: boolean;
  onBack: () => void;
}

export function NotesLayout({ sidebar, editor, showEditor }: NotesLayoutProps) {
  const isDesktop = useBreakpoint('md');

  if (isDesktop) {
    return (
      <div className="border-border flex h-[600px] overflow-hidden rounded-lg border">
        <div className="border-border flex w-[280px] shrink-0 flex-col border-r">{sidebar}</div>
        <div className="min-w-0 flex-1 overflow-y-auto">{editor}</div>
      </div>
    );
  }

  // Mobile: show either list or editor
  return <div className="h-[600px]">{showEditor ? editor : sidebar}</div>;
}
