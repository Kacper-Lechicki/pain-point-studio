'use client';

import { Calendar, Clock } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { MetricRow, SectionLabel } from '@/components/ui/metric-display';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import { PROJECT_STATUS_CONFIG } from '@/features/projects/config/status';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { Project, ProjectStatus } from '@/features/projects/types';

const DATE_FORMAT = {
  dateStyle: 'medium',
  timeStyle: 'short',
} as const;

interface ProjectDetailInfoProps {
  project: Project;
}

export function ProjectDetailInfo({ project }: ProjectDetailInfoProps) {
  const t = useTranslations('projects.detail');
  const format = useFormatter();
  const isArchived = isProjectArchived(project);
  const formatDate = (iso: string) => format.dateTime(new Date(iso), DATE_FORMAT);
  const statusConfig = PROJECT_STATUS_CONFIG[project.status as ProjectStatus];
  const StatusIcon = statusConfig?.icon;

  return (
    <div>
      <SectionLabel>{t('detailsLabel')}</SectionLabel>
      <div className="space-y-2">
        <MetricRow
          icon={StatusIcon}
          label={t('status')}
          value={<ProjectStatusBadge status={project.status as ProjectStatus} />}
        />
        {isArchived && project.archived_at && (
          <MetricRow
            icon={Calendar}
            label={t('archivedAt')}
            value={formatDate(project.archived_at)}
          />
        )}
        <MetricRow icon={Calendar} label={t('created')} value={formatDate(project.created_at)} />
        <MetricRow icon={Clock} label={t('updated')} value={formatDate(project.updated_at)} />
      </div>
    </div>
  );
}
