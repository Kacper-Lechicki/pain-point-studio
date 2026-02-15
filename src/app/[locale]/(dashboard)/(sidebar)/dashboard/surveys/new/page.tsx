import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { DASHBOARD_PAGE_BODY_GAP } from '@/features/dashboard/config/layout';
import { getSurveyFormData } from '@/features/surveys/actions';
import { SurveyMetadataForm } from '@/features/surveys/components/survey-metadata-form';

export default async function NewSurveyPage() {
  const [formData, t] = await Promise.all([getSurveyFormData(), getTranslations()]);

  return (
    <PageTransition>
      <div className={DASHBOARD_PAGE_BODY_GAP}>
        <h1 className="text-3xl font-bold">{t('surveys.create.title')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t('surveys.create.description')}</p>
      </div>

      <SurveyMetadataForm categoryOptions={formData.categoryOptions} />
    </PageTransition>
  );
}
