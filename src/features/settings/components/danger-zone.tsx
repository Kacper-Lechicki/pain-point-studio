'use client';

import { useState } from 'react';

import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { DeleteAccountDialog } from '@/features/settings/components/delete-account-dialog';
import { SettingsSectionHeader } from '@/features/settings/components/settings-section-header';

interface DangerZoneProps {
  userEmail: string;
  activeSurveyCount: number;
  responseCount: number;
}

const DangerZone = ({ userEmail, activeSurveyCount, responseCount }: DangerZoneProps) => {
  const t = useTranslations();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <section className="space-y-8">
        <SettingsSectionHeader
          title={t('settings.dangerZone.title')}
          description={t('settings.dangerZone.description')}
          variant="destructive"
        />

        <div className="border-destructive/30 bg-destructive/5 rounded-lg border px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium">{t('settings.dangerZone.deleteAccount')}</p>
              <p className="text-muted-foreground text-xs">
                {t('settings.dangerZone.deleteDescription')}
              </p>
            </div>

            <Button variant="destructive" className="shrink-0" onClick={() => setDialogOpen(true)}>
              <Trash2 className="size-4" aria-hidden="true" />
              {t('settings.dangerZone.deleteAccount')}
            </Button>
          </div>
        </div>
      </section>

      <DeleteAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userEmail={userEmail}
        activeSurveyCount={activeSurveyCount}
        responseCount={responseCount}
      />
    </>
  );
};

export { DangerZone };
