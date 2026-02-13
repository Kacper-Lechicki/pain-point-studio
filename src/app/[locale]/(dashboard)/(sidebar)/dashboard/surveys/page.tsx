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
  const [surveys, t] = await Promise.all([getUserSurveys(), getTranslations('surveys')]);

  const activeSurveys = surveys?.filter((s) => s.status !== 'archived') ?? [];
  const hasSurveys = activeSurveys.length > 0;

  return (
    <PageTransition>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('description')}</p>
        </div>

        {hasSurveys && (
          <Button asChild className="w-full sm:w-auto">
            <Link href={ROUTES.dashboard.surveysNew}>
              <Plus className="size-4" aria-hidden />
              {t('createSurvey')}
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
            title={t('empty.title')}
            description={t('empty.description')}
            action={
              <Button asChild>
                <Link href={ROUTES.dashboard.surveysNew}>
                  <Plus className="size-4" aria-hidden />
                  {t('empty.cta')}
                </Link>
              </Button>
            }
          />
        )}
      </div>
    </PageTransition>
  );
}
