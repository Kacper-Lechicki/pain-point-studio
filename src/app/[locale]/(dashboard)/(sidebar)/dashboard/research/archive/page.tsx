import { Archive, Info } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { PageTransition } from '@/components/ui/page-transition';
import { DASHBOARD_PAGE_BODY_GAP_TOP } from '@/features/dashboard/config/layout';
import { getUserSurveys } from '@/features/surveys/actions';
import { ArchiveSurveyList } from '@/features/surveys/components/dashboard/archive-survey-list';

export default async function SurveysArchivePage() {
  const [surveys, t] = await Promise.all([getUserSurveys(), getTranslations()]);

  const archivedSurveys = surveys?.filter((s) => s.status === 'archived') ?? [];

  return (
    <PageTransition>
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Archive className="size-7 shrink-0" aria-hidden />
          {t('surveys.archive.title')}
        </h1>

        <p className="text-muted-foreground mt-1 text-sm">{t('surveys.archive.description')}</p>
        {archivedSurveys.length > 0 && (
          <Alert variant="info" className="mt-4 text-xs">
            <Info className="size-3.5" />
            <AlertDescription>{t('surveys.archive.retentionNotice')}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className={DASHBOARD_PAGE_BODY_GAP_TOP}>
        {archivedSurveys.length > 0 ? (
          <ArchiveSurveyList initialSurveys={archivedSurveys} />
        ) : (
          <EmptyState
            icon={Archive}
            title={t('surveys.archive.empty.title')}
            description={t('surveys.archive.empty.description')}
          />
        )}
      </div>
    </PageTransition>
  );
}
