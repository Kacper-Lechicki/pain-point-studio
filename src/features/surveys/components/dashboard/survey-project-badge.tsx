import { FolderKanban } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/config/routes';
import Link from '@/i18n/link';

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
        <Link
          href={`${ROUTES.dashboard.projectDetail}/${projectId}`}
          onClick={(e) => e.stopPropagation()}
        >
          <FolderKanban className="!size-3 shrink-0" aria-hidden />
          <span className="truncate">{projectName}</span>
        </Link>
      </Badge>
    </div>
  );
}
