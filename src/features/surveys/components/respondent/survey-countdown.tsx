'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { CalendarClock } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { PageTransition } from '@/components/ui/page-transition';

interface SurveyCountdownProps {
  title: string;
  startsAt: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(startsAt: string): TimeLeft | null {
  const diff = new Date(startsAt).getTime() - Date.now();

  if (diff <= 0) {
    return null;
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export const SurveyCountdown = ({ title, startsAt }: SurveyCountdownProps) => {
  const t = useTranslations();
  const format = useFormatter();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => getTimeLeft(startsAt));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getTimeLeft(startsAt);

      if (!remaining) {
        clearInterval(interval);
        router.refresh();

        return;
      }

      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [startsAt, router]);

  const formattedDate = format.dateTime(new Date(startsAt), {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-16 text-center">
        <div className="bg-muted mb-6 flex size-16 items-center justify-center rounded-full">
          <CalendarClock className="text-muted-foreground size-8" />
        </div>
        <h1 className="text-foreground mb-2 text-xl font-semibold">
          {t('respondent.countdown.title')}
        </h1>
        <p className="text-muted-foreground mb-8 max-w-sm">
          {t('respondent.countdown.description', { date: formattedDate })}
        </p>

        {timeLeft && (
          <div className="mb-8 flex gap-3">
            {timeLeft.days > 0 && (
              <CountdownUnit value={timeLeft.days} label={t('respondent.countdown.days')} />
            )}
            <CountdownUnit value={timeLeft.hours} label={t('respondent.countdown.hours')} />
            <CountdownUnit value={timeLeft.minutes} label={t('respondent.countdown.minutes')} />
            <CountdownUnit value={timeLeft.seconds} label={t('respondent.countdown.seconds')} />
          </div>
        )}

        <p className="text-muted-foreground text-sm">{t('respondent.countdown.encouragement')}</p>
        <p className="text-muted-foreground mt-4 text-xs">{title}</p>
      </div>
    </PageTransition>
  );
};

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-muted text-foreground flex size-14 items-center justify-center rounded-lg text-2xl font-bold tabular-nums">
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-muted-foreground mt-1.5 text-[11px] tracking-wider uppercase">
        {label}
      </span>
    </div>
  );
}
