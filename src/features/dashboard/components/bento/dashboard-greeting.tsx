'use client';

import { useTranslations } from 'next-intl';

interface DashboardGreetingProps {
  fullName: string;
}

export function DashboardGreeting({ fullName }: DashboardGreetingProps) {
  const t = useTranslations('dashboard.bento');
  const firstName = fullName.split(' ')[0] ?? fullName;

  return (
    <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
      {t('greeting', { name: firstName })}
    </h1>
  );
}
