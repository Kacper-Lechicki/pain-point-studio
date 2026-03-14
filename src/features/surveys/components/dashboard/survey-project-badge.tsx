'use client';

import { FolderKanban } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import Link from '@/i18n/link';
import { getProjectDetailUrl } from '@/lib/common/urls/project-urls';

interface SurveyProjectBadgeProps {
  projectId: string | null;
  projectName: string | null;
}

export function SurveyProjectBadge({ projectId, projectName }: SurveyProjectBadgeProps) {
  if (!projectId || !projectName) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      <Badge variant="secondary" className="max-w-full gap-1 px-1.5 py-0 text-[11px]" asChild>
        <Link href={getProjectDetailUrl(projectId)} onClick={(e) => e.stopPropagation()}>
          <FolderKanban className="!size-3 shrink-0" aria-hidden />
          <span className="truncate">{projectName}</span>
        </Link>
      </Badge>
    </div>
  );
}
