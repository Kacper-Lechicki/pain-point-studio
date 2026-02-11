import { ClipboardList } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config/routes';
import { getUserSurveys } from '@/features/surveys/actions';
import { SurveyList } from '@/features/surveys/components/dashboard/survey-list';
import Link from '@/i18n/link';

export default async function SurveysPage() {
  const [surveys, t] = await Promise.all([getUserSurveys(), getTranslations('surveys')]);

  const hasSurveys = surveys !== null && surveys.length > 0;

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
            <SurveyList initialSurveys={surveys} />
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
