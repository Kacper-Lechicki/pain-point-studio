import type { ReactNode } from 'react';

export default function BuilderLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden" data-builder-layout>
      {children}
    </div>
  );
}
