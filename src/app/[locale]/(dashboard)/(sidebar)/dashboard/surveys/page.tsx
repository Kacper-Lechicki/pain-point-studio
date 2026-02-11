import { ClipboardList } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config/routes';
import Link from '@/i18n/link';

export default function SurveysPage() {
  const t = useTranslations('surveys');

  // TODO: Replace with real survey data check once DB is wired up
  const hasSurveys = false;

  return (
    <PageTransition>
      <div className="max-w-3xl px-6 pt-4 pb-8 sm:px-4 md:pt-8 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{t('description')}</p>
          </div>
          {hasSurveys && (
            <Button asChild>
              <Link href={ROUTES.dashboard.surveysNew}>{t('createSurvey')}</Link>
            </Button>
          )}
        </div>

        <div className="mt-8">
          {hasSurveys ? (
            // TODO: Survey list will go here in a later stage
            <div />
          ) : (
            <EmptyState
              icon={ClipboardList}
              title={t('empty.title')}
              description={t('empty.description')}
              action={
                <Button asChild>
                  <Link href={ROUTES.dashboard.surveysNew}>{t('empty.cta')}</Link>
                </Button>
              }
            />
          )}
        </div>
      </div>
    </PageTransition>
  );
}
