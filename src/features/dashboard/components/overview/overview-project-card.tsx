import { useFormatter, useTranslations } from 'next-intl';

import type { OverviewProject } from '@/features/dashboard/actions/get-dashboard-overview';
import { ValidationProgressDots } from '@/features/projects/components/validation-progress-dots';
import { PROJECT_CONTEXTS_CONFIG } from '@/features/projects/config/contexts';
import { getProjectDetailUrl } from '@/features/projects/lib/project-urls';
import type { ProjectContext } from '@/features/projects/types';
import Link from '@/i18n/link';
import type { MessageKey } from '@/i18n/types';

export function OverviewProjectCard({ project }: { project: OverviewProject }) {
  const t = useTranslations();
  const format = useFormatter();
  const contextConfig = PROJECT_CONTEXTS_CONFIG[project.context as ProjectContext];
  const updatedAtLabel = format.relativeTime(new Date(project.updatedAt), new Date());

  return (
    <Link
      href={getProjectDetailUrl(project.id)}
      className="border-border/50 hover:border-border hover:bg-muted/30 flex min-w-0 flex-col gap-3 rounded-lg border p-3 transition-colors"
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <span className="text-foreground truncate text-sm font-semibold">{project.name}</span>
      </div>

      <p className="text-muted-foreground -mt-1 line-clamp-1 min-h-4 text-xs">
        {project.description || '\u00A0'}
      </p>

      <div className="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div className="flex flex-col gap-0.5">
          <span>{t(contextConfig.labelKey as MessageKey)}</span>

          <span className="text-foreground font-medium">
            {t('projects.list.card.surveys', { count: project.surveyCount })}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span>{t('projects.list.card.responses', { count: project.responseCount })}</span>

          {project.phaseStatuses ? (
            <ValidationProgressDots phaseStatuses={project.phaseStatuses} />
          ) : (
            <span className="text-foreground font-medium">—</span>
          )}
        </div>

        <div className="flex flex-col gap-0.5">
          <span>{t('projects.list.card.updated')}</span>
          <span className="text-foreground font-medium">{updatedAtLabel}</span>
        </div>
      </div>
    </Link>
  );
}
