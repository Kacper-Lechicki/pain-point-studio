'use client';

import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useLocale } from 'next-intl';

import { ROUTES } from '@/config/routes';
import type { SurveyCategoryOption } from '@/features/surveys/actions';
import { QuestionBuilderProvider } from '@/features/surveys/hooks/use-question-builder-context';
import { getSurveyShareUrl } from '@/features/surveys/lib/share-url';
import type { QuestionSchema, SurveyMetadataSchema } from '@/features/surveys/types';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';

import { BuilderCenter } from './builder-center';
import { BuilderMetadataPanel } from './builder-metadata-panel';
import { BuilderSettingsPanel } from './builder-settings-panel';
import { BuilderSidebar } from './builder-sidebar';
import { BuilderTopBar } from './builder-top-bar';
import { PublishSuccessPanel } from './publish-success-panel';

interface QuestionBuilderPageProps {
  surveyId: string;
  surveyTitle: string;
  surveyStatus: string;
  surveyMetadata: Omit<SurveyMetadataSchema, 'title'>;
  categoryOptions: SurveyCategoryOption[];
  initialQuestions: QuestionSchema[];
}

export function QuestionBuilderPage({
  surveyId,
  surveyTitle,
  surveyStatus,
  surveyMetadata,
  categoryOptions,
  initialQuestions,
}: QuestionBuilderPageProps) {
  const isDesktop = useBreakpoint('xl');
  const locale = useLocale();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [metadataPanelOpen, setMetadataPanelOpen] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  function openMetadataPanel() {
    setSettingsOpen(false);
    setMetadataPanelOpen(true);
  }

  function openSettingsPanel() {
    setMetadataPanelOpen(false);
    setSettingsOpen(true);
  }

  const handlePublished = useCallback((slug: string) => {
    setPublishedSlug(slug);
    setSettingsOpen(false);
    setMetadataPanelOpen(false);
  }, []);

  const isPublished = publishedSlug !== null;

  return (
    <QuestionBuilderProvider initialQuestions={initialQuestions}>
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <BuilderTopBar
          surveyId={surveyId}
          surveyTitle={surveyTitle}
          surveyStatus={surveyStatus}
          isDesktop={isDesktop}
          onToggleSidebar={() => setSidebarOpen(true)}
          onToggleSettings={openSettingsPanel}
          onOpenMetadataPanel={openMetadataPanel}
          onPublished={handlePublished}
        />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <BuilderSidebar isDesktop={isDesktop} open={sidebarOpen} onOpenChange={setSidebarOpen} />
          <BuilderCenter />

          <BuilderSettingsPanel
            isDesktop={isDesktop}
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
          />
          <BuilderMetadataPanel
            open={metadataPanelOpen}
            onOpenChange={setMetadataPanelOpen}
            surveyId={surveyId}
            surveyTitle={surveyTitle}
            surveyMetadata={surveyMetadata}
            categoryOptions={categoryOptions}
          />

          {isPublished && (
            <PublishSuccessPanel
              open
              onClose={() => router.push(ROUTES.dashboard.surveys)}
              shareUrl={getSurveyShareUrl(locale, publishedSlug)}
              surveyId={surveyId}
              surveyTitle={surveyTitle}
            />
          )}
        </div>
      </div>
    </QuestionBuilderProvider>
  );
}
