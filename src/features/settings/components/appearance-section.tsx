'use client';

import { useTranslations } from 'next-intl';

import { SettingsSectionHeader } from '@/features/settings/components/settings-section-header';
import { ACCENT_OPTIONS, type Accent, useAccent } from '@/hooks/common/use-accent';
import { cn } from '@/lib/common/utils';

const ACCENT_PREVIEW: Record<Accent, string> = {
  blue: 'bg-blue-500',
  teal: 'bg-teal-500',
  indigo: 'bg-indigo-500',
};

const AppearanceSection = () => {
  const t = useTranslations('settings.appearance');
  const { accent, setAccent } = useAccent();

  return (
    <section className="space-y-8">
      <SettingsSectionHeader title={t('title')} description={t('description')} />

      <div className="space-y-3">
        <p className="text-sm font-medium">{t('accentColor')}</p>

        <div className="flex flex-wrap gap-2">
          {ACCENT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              data-accent={option}
              onClick={() => setAccent(option)}
              className={cn(
                'flex min-h-10 items-center gap-2.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors md:min-h-9',
                accent === option
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border text-muted-foreground md:hover:bg-accent md:hover:text-foreground'
              )}
            >
              <span className={cn('size-3.5 rounded-full', ACCENT_PREVIEW[option])} />
              {t(`accents.${option}`)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export { AppearanceSection };
