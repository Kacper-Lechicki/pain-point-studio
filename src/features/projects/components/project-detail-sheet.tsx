'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ProjectDetail } from '@/features/projects/actions/get-project';
import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import { ProjectDetailPanel } from '@/features/projects/components/project-detail-panel';

interface ProjectDetailSheetProps {
  open: boolean;
  onClose: () => void;
  project: ProjectWithMetrics | null;
  projectDetail: ProjectDetail | null;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  detailsLabel: string;
}

export function ProjectDetailSheet({
  open,
  onClose,
  project,
  projectDetail,
  onEdit,
  onArchive,
  onDelete,
  detailsLabel,
}: ProjectDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="flex h-full w-[85%] max-w-[420px] flex-col gap-0 overflow-y-auto p-0 sm:max-w-[420px]"
        showCloseButton={true}
      >
        <SheetHeader className="border-border h-14 shrink-0 flex-row items-center gap-0 border-b px-4 py-0 pr-12">
          <SheetTitle className="text-foreground text-base font-semibold">
            {detailsLabel}
          </SheetTitle>

          <SheetDescription className="sr-only">{project?.name}</SheetDescription>
        </SheetHeader>

        {open && project && (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-16">
            <ProjectDetailPanel
              project={project}
              projectDetail={projectDetail}
              onEdit={onEdit}
              onArchive={onArchive}
              onDelete={onDelete}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
