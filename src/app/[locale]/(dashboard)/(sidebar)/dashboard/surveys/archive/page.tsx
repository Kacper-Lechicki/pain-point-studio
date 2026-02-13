import { Archive, Info } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { EmptyState } from '@/components/ui/empty-state';
import { PageTransition } from '@/components/ui/page-transition';
import { DASHBOARD_PAGE_BODY_GAP_TOP } from '@/features/dashboard/config/layout';
import { getUserSurveys } from '@/features/surveys/actions';
import { ArchiveSurveyList } from '@/features/surveys/components/dashboard/archive-survey-list';

export default async function SurveysArchivePage() {
  const [surveys, t] = await Promise.all([getUserSurveys(), getTranslations('surveys.archive')]);

  const archivedSurveys = surveys?.filter((s) => s.status === 'archived') ?? [];

  return (
    <PageTransition>
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t('description')}</p>
        {archivedSurveys.length > 0 && (
          <div className="bg-muted/50 text-muted-foreground mt-4 flex items-start gap-2.5 rounded-lg border border-dashed px-3.5 py-3 text-xs leading-relaxed">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>{t('retentionNotice')}</span>
          </div>
        )}
      </div>

      <div className={DASHBOARD_PAGE_BODY_GAP_TOP}>
        {archivedSurveys.length > 0 ? (
          <ArchiveSurveyList initialSurveys={archivedSurveys} />
        ) : (
          <EmptyState
            icon={Archive}
            title={t('empty.title')}
            description={t('empty.description')}
          />
        )}
      </div>
    </PageTransition>
  );
}
