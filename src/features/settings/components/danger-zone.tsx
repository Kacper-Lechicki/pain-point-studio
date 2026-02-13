'use client';

import { useState } from 'react';

import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { DeleteAccountDialog } from '@/features/settings/components/delete-account-dialog';
import { SettingsSectionHeader } from '@/features/settings/components/settings-section-header';

interface DangerZoneProps {
  userEmail: string;
}

const DangerZone = ({ userEmail }: DangerZoneProps) => {
  const t = useTranslations('settings.dangerZone');
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <section className="space-y-8">
        <SettingsSectionHeader
          title={t('title')}
          description={t('description')}
          variant="destructive"
        />

        <div className="border-destructive/30 bg-destructive/5 rounded-lg border px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium">{t('deleteAccount')}</p>
              <p className="text-muted-foreground text-xs">{t('deleteDescription')}</p>
            </div>

            <Button variant="destructive" className="shrink-0" onClick={() => setDialogOpen(true)}>
              <Trash2 className="size-4" aria-hidden="true" />
              {t('deleteAccount')}
            </Button>
          </div>
        </div>
      </section>

      <DeleteAccountDialog open={dialogOpen} onOpenChange={setDialogOpen} userEmail={userEmail} />
    </>
  );
};

export { DangerZone };
