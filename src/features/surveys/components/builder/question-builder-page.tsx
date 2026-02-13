'use client';

import { useState } from 'react';

import type { SurveyCategoryOption } from '@/features/surveys/actions';
import type { QuestionSchema, SurveyMetadataSchema } from '@/features/surveys/types';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';

import { QuestionBuilderProvider } from '../../hooks/use-question-builder-context';
import { BuilderCenter } from './builder-center';
import { BuilderMetadataPanel } from './builder-metadata-panel';
import { BuilderSettingsPanel } from './builder-settings-panel';
import { BuilderSidebar } from './builder-sidebar';
import { BuilderTopBar } from './builder-top-bar';

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
  const isDesktop = useBreakpoint('lg');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [metadataPanelOpen, setMetadataPanelOpen] = useState(false);

  function openMetadataPanel() {
    setSettingsOpen(false);
    setMetadataPanelOpen(true);
  }

  function openSettingsPanel() {
    setMetadataPanelOpen(false);
    setSettingsOpen(true);
  }

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
        </div>
      </div>
    </QuestionBuilderProvider>
  );
}
