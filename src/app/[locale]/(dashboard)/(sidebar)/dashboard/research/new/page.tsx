import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { DASHBOARD_PAGE_BODY_GAP } from '@/features/dashboard/config/layout';
import { RESEARCH_PHASES, type ResearchPhase } from '@/features/projects/types';
import { getSurveyFormData } from '@/features/surveys/actions';
import { SurveyMetadataForm } from '@/features/surveys/components/builder/survey-metadata-form';

interface Props {
  searchParams: Promise<{ projectId?: string; phase?: string }>;
}

export default async function NewSurveyPage({ searchParams }: Props) {
  const [formData, t, params] = await Promise.all([
    getSurveyFormData(),
    getTranslations(),
    searchParams,
  ]);

  const projectId = params.projectId ?? null;

  const researchPhase = (RESEARCH_PHASES as readonly string[]).includes(params.phase ?? '')
    ? (params.phase as ResearchPhase)
    : null;

  return (
    <PageTransition>
      <div className={DASHBOARD_PAGE_BODY_GAP}>
        <h1 className="text-3xl font-bold">{t('surveys.create.title')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t('surveys.create.description')}</p>
      </div>

      <SurveyMetadataForm
        categoryOptions={formData.categoryOptions}
        projectOptions={formData.projectOptions}
        defaultValues={{ projectId, researchPhase }}
      />
    </PageTransition>
  );
}
