import { useTranslations } from 'next-intl';

import { SortableTableHeader } from '@/components/ui/sortable-table-header';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import type { ProjectsListExtrasMap } from '@/features/projects/actions/get-projects-list-extras';
import type { ProjectSortBy } from '@/features/projects/components/project-list-toolbar';
import { ProjectTableRow } from '@/features/projects/components/project-table-row';

interface ProjectListTableProps {
  projects: ProjectWithMetrics[];
  extras?: ProjectsListExtrasMap | null | undefined;
  sortBy: ProjectSortBy;
  sortDir: 'asc' | 'desc';
  onSortByColumn: (key: ProjectSortBy) => void;
  onSelect: (projectId: string) => void;
  onDelete: (project: ProjectWithMetrics) => void;
}

export function ProjectListTable({
  projects,
  extras,
  sortBy,
  sortDir,
  onSortByColumn,
  onSelect,
  onDelete,
}: ProjectListTableProps) {
  const t = useTranslations();

  return (
    <div className="border-border/50 bg-card min-w-0 overflow-auto rounded-lg border">
      <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
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

            <TableHead className="border-border/30 text-muted-foreground hidden w-[14%] min-w-0 shrink-0 border-l px-4 py-3 text-center text-xs font-medium md:table-cell">
              {t('projects.list.table.activity')}
            </TableHead>

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
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
