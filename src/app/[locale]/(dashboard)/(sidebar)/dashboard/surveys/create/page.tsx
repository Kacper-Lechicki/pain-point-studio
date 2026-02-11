import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { getSurveyFormData } from '@/features/surveys/actions';
import { SurveyMetadataForm } from '@/features/surveys/components/survey-metadata-form';

export default async function CreateSurveyPage() {
  const [formData, t] = await Promise.all([getSurveyFormData(), getTranslations('surveys.create')]);

  return (
    <PageTransition>
      <div className="max-w-3xl px-6 pt-4 pb-8 sm:px-4 md:pt-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('description')}</p>
        </div>
        <SurveyMetadataForm categoryOptions={formData.categoryOptions} />
      </div>
    </PageTransition>
  );
}
