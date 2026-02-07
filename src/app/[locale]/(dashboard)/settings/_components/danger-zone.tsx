'use client';

import { useState } from 'react';

import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { DeleteAccountDialog } from '@/app/[locale]/(dashboard)/settings/_components/delete-account-dialog';
import { Button } from '@/components/ui/button';

const DangerZone = () => {
  const t = useTranslations('settings.dangerZone');
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <section className="border-destructive/50 rounded-lg border p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-destructive text-lg font-semibold">{t('title')}</h2>
            <p className="text-muted-foreground text-sm">{t('description')}</p>

            <div className="pt-2">
              <p className="text-sm font-medium">{t('deleteAccount')}</p>
              <p className="text-muted-foreground text-sm">{t('deleteDescription')}</p>
            </div>
          </div>

          <Button
            variant="destructive"
            size="sm"
            className="shrink-0 sm:mt-0"
            onClick={() => setDialogOpen(true)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {t('deleteAccount')}
          </Button>
        </div>
      </section>

      <DeleteAccountDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
};

export { DangerZone };
