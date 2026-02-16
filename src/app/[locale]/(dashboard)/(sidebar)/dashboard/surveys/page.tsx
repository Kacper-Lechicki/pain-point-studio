import { ClipboardList, Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config/routes';
import { DASHBOARD_PAGE_BODY_GAP_TOP } from '@/features/dashboard/config/layout';
import { getUserSurveys } from '@/features/surveys/actions';
import { SurveyList } from '@/features/surveys/components/dashboard/survey-list';
import Link from '@/i18n/link';

export default async function SurveysPage() {
  const [surveys, t] = await Promise.all([getUserSurveys(), getTranslations()]);

  const activeSurveys = surveys?.filter((s) => s.status !== 'archived') ?? [];
  const hasSurveys = activeSurveys.length > 0;

  return (
    <PageTransition>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <ClipboardList className="size-7 shrink-0" aria-hidden />
            {t('surveys.title')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('surveys.description')}</p>
        </div>

        {hasSurveys && (
          <Button asChild className="w-full sm:w-auto">
            <Link href={ROUTES.dashboard.surveysNew}>
              <Plus className="size-4" aria-hidden />
              {t('surveys.createSurvey')}
            </Link>
          </Button>
        )}
      </div>

      <div className={DASHBOARD_PAGE_BODY_GAP_TOP}>
        {hasSurveys ? (
          <SurveyList initialSurveys={activeSurveys} />
        ) : (
          <EmptyState
            icon={ClipboardList}
            title={t('surveys.empty.title')}
            description={t('surveys.empty.description')}
            action={
              <Button asChild>
                <Link href={ROUTES.dashboard.surveysNew}>
                  <Plus className="size-4" aria-hidden />
                  {t('surveys.empty.cta')}
                </Link>
              </Button>
            }
          />
        )}
      </div>
    </PageTransition>
  );
}
