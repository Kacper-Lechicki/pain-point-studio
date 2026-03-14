'use client';

import { useMemo, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useLocale, useTranslations } from 'next-intl';

import { ROUTES } from '@/config/routes';
import type { ProjectOption } from '@/features/surveys/actions';
import { BuilderCenter } from '@/features/surveys/components/builder/builder-center';
import { BuilderMetadataPanel } from '@/features/surveys/components/builder/builder-metadata-panel';
import { BuilderSettingsPanel } from '@/features/surveys/components/builder/builder-settings-panel';
import { BuilderSidebar } from '@/features/surveys/components/builder/builder-sidebar';
import { BuilderTopBar } from '@/features/surveys/components/builder/builder-top-bar';
import { PublishSettingsPanel } from '@/features/surveys/components/builder/publish-settings-panel';
import { PublishSuccessPanel } from '@/features/surveys/components/builder/publish-success-panel';
import { QuestionBuilderProvider } from '@/features/surveys/hooks/use-question-builder-context';
import { getSurveyShareUrl } from '@/features/surveys/lib/share-url';
import type { QuestionSchema, SurveyMetadataSchema, SurveyStatus } from '@/features/surveys/types';
import {
  type BreadcrumbCrumb,
  useBreadcrumbSegment,
  useBreadcrumbTrail,
} from '@/hooks/common/use-breadcrumb';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';
import { getProjectDetailUrl } from '@/lib/common/urls/project-urls';
import { getSurveyEditUrl } from '@/lib/common/urls/survey-urls';

interface QuestionBuilderPageProps {
  surveyId: string;
  surveyTitle: string;
  surveyStatus: SurveyStatus;
  projectId: string;
  surveyMetadata: Omit<SurveyMetadataSchema, 'title'>;
  projectOptions: ProjectOption[];
  initialQuestions: QuestionSchema[];
}

export function QuestionBuilderPage({
  surveyId,
  surveyTitle,
  surveyStatus,
  projectId,
  surveyMetadata,
  projectOptions,
  initialQuestions,
}: QuestionBuilderPageProps) {
  const isDesktop = useBreakpoint('xl');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [metadataPanelOpen, setMetadataPanelOpen] = useState(false);
  const [publishSettingsOpen, setPublishSettingsOpen] = useState(
    () => searchParams.get('publish') === 'true'
  );
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  function openMetadataPanel() {
    setSettingsOpen(false);
    setMetadataPanelOpen(true);
  }

  function openSettingsPanel() {
    setMetadataPanelOpen(false);
    setSettingsOpen(true);
  }

  function openPublishSettings() {
    setSettingsOpen(false);
    setMetadataPanelOpen(false);
    setPublishSettingsOpen(true);
  }

  function handlePublished(slug: string) {
    setPublishedSlug(slug);
    setPublishSettingsOpen(false);
    setSettingsOpen(false);
    setMetadataPanelOpen(false);
  }

  const isPublished = publishedSlug !== null;
  const projectName = projectOptions.find((p) => p.value === projectId)?.label ?? null;

  const t = useTranslations();
  const breadcrumbTrail = useMemo(() => {
    const base: BreadcrumbCrumb[] = [
      { label: t('breadcrumbs.dashboard'), href: ROUTES.common.dashboard },
      { label: t('breadcrumbs.projects'), href: ROUTES.dashboard.projects },
    ];

    if (projectName) {
      base.push({
        label: projectName,
        href: `${getProjectDetailUrl(projectId)}?tab=surveys`,
      });
    }

    base.push({
      label: surveyTitle,
      href: getSurveyEditUrl(surveyId),
    });

    return base;
  }, [t, projectName, projectId, surveyTitle, surveyId]);

  useBreadcrumbTrail(breadcrumbTrail);
  useBreadcrumbSegment(surveyId, surveyTitle);

  return (
    <QuestionBuilderProvider initialQuestions={initialQuestions}>
      <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
        <BuilderTopBar
          surveyId={surveyId}
          surveyTitle={surveyTitle}
          surveyStatus={surveyStatus}
          projectId={projectId}
          projectName={projectName}
          isDesktop={isDesktop}
          onToggleSidebar={() => setSidebarOpen(true)}
          onToggleSettings={openSettingsPanel}
          onOpenMetadataPanel={openMetadataPanel}
          onOpenPublishSettings={openPublishSettings}
        />

        <div className="flex h-full min-h-0 flex-1 overflow-hidden">
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
            projectOptions={projectOptions}
          />

          <PublishSettingsPanel
            open={publishSettingsOpen}
            onOpenChange={setPublishSettingsOpen}
            surveyId={surveyId}
            onPublished={handlePublished}
          />

          {isPublished && (
            <PublishSuccessPanel
              open
              onClose={() => router.replace(`${getProjectDetailUrl(projectId)}?tab=surveys`)}
              shareUrl={getSurveyShareUrl(locale, publishedSlug)}
              surveyId={surveyId}
              surveyTitle={surveyTitle}
              projectId={projectId}
            />
          )}
        </div>
      </div>
    </QuestionBuilderProvider>
  );
}
