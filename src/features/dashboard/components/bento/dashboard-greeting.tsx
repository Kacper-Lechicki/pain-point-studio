'use client';

import { Hand } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DashboardGreetingProps {
  fullName: string;
}

export function DashboardGreeting({ fullName }: DashboardGreetingProps) {
  const t = useTranslations('dashboard.bento');
  const firstName = fullName.split(' ')[0] ?? fullName;

  return (
    <h1 className="text-foreground flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
      {t('greeting', { name: firstName })}
      <Hand className="text-foreground size-4 shrink-0 rotate-[30deg] sm:size-5" aria-hidden />
    </h1>
  );
}
