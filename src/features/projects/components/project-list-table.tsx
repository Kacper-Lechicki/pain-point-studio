import { useTranslations } from 'next-intl';

import { Checkbox } from '@/components/ui/checkbox';
import { SortableTableHeader } from '@/components/ui/sortable-table-header';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import type { ProjectsListExtrasMap } from '@/features/projects/actions/get-projects-list-extras';
import type { ProjectSortBy } from '@/features/projects/components/project-list-toolbar';
import { ProjectTableRow } from '@/features/projects/components/project-table-row';
import type { ProjectAction } from '@/features/projects/config/status';

interface ProjectListTableProps {
  projects: ProjectWithMetrics[];
  extras?: ProjectsListExtrasMap | null | undefined;
  sortBy: ProjectSortBy;
  sortDir: 'asc' | 'desc';
  onSortByColumn: (key: ProjectSortBy) => void;
  onSelect: (projectId: string) => void;
  onAction: (project: ProjectWithMetrics, action: ProjectAction) => void;
  selectedIds?: Set<string> | undefined;
  onToggleSelect?: ((id: string) => void) | undefined;
  onSelectAll?: ((projects: ProjectWithMetrics[]) => void) | undefined;
  onClearSelection?: (() => void) | undefined;
}

export function ProjectListTable({
  projects,
  extras,
  sortBy,
  sortDir,
  onSortByColumn,
  onSelect,
  onAction,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
}: ProjectListTableProps) {
  const t = useTranslations();

  const { allSelected, someSelected } = (() => {
    if (!selectedIds || projects.length === 0) {
      return { allSelected: false, someSelected: false };
    }

    const selectedCount = projects.filter((p) => selectedIds.has(p.id)).length;

    return {
      allSelected: selectedCount === projects.length,
      someSelected: selectedCount > 0 && selectedCount < projects.length,
    };
  })();

  return (
    <div className="border-border/50 bg-card min-w-0 overflow-auto rounded-lg border">
      <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
            {onToggleSelect && (
              <TableHead className="w-10 shrink-0 px-3 py-3">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onSelectAll?.(projects);
                    } else {
                      onClearSelection?.();
                    }
                  }}
                  aria-label={t('projects.list.bulk.selectAll')}
                />
              </TableHead>
            )}
            <SortableTableHeader
              sortKey="name"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('projects.list.table.name')}
              className="w-[44%] min-w-0 px-4 py-3"
            />

            <SortableTableHeader
              sortKey="status"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('projects.list.table.status')}
              centered
              className="border-border/30 w-[14%] min-w-0 shrink-0 border-l px-4 py-3"
            />

            <SortableTableHeader
              sortKey="surveys"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('projects.list.table.surveys')}
              className="border-border/30 w-[14%] min-w-0 shrink-0 border-l px-5 py-3"
            />

            <SortableTableHeader
              sortKey="responses"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('projects.list.table.responses')}
              className="border-border/30 w-[14%] min-w-0 shrink-0 border-l px-5 py-3"
            />

            <SortableTableHeader
              sortKey="activity"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('projects.list.table.activity')}
              centered
              className="border-border/30 hidden w-[14%] min-w-0 shrink-0 border-l px-4 py-3 md:table-cell"
            />

            <TableHead className="w-12 shrink-0 py-3" aria-hidden />
          </TableRow>
        </TableHeader>

        <TableBody>
          {projects.map((project) => (
            <ProjectTableRow
              key={project.id}
              project={project}
              extras={extras?.[project.id]}
              onSelect={onSelect}
              onAction={onAction}
              isSelected={selectedIds?.has(project.id) ?? false}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
