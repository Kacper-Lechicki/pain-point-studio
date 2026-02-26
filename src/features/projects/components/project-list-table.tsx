import { useTranslations } from 'next-intl';

import { SortableTableHeader } from '@/components/ui/sortable-table-header';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import type { ProjectSortBy } from '@/features/projects/components/project-list-toolbar';
import { ProjectTableRow } from '@/features/projects/components/project-table-row';

interface ProjectListTableProps {
  projects: ProjectWithMetrics[];
  sortBy: ProjectSortBy;
  sortDir: 'asc' | 'desc';
  now: Date;
  onSortByColumn: (key: ProjectSortBy) => void;
  onSelect: (projectId: string) => void;
  onDelete: (project: ProjectWithMetrics) => void;
}

export function ProjectListTable({
  projects,
  sortBy,
  sortDir,
  now,
  onSortByColumn,
  onSelect,
  onDelete,
}: ProjectListTableProps) {
  const t = useTranslations();

  return (
    <div className="border-border/50 min-w-0 overflow-auto rounded-lg border">
      <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <SortableTableHeader
              sortKey="name"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('projects.list.table.name')}
              className="w-[42%] min-w-0 px-4 py-3"
            />

            <SortableTableHeader
              sortKey="status"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('projects.list.table.status')}
              className="border-border/30 w-[11%] min-w-0 border-l px-4 py-3"
              centered
            />

            <SortableTableHeader
              sortKey="surveys"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('projects.list.table.surveys')}
              className="border-border/30 w-[11%] min-w-0 border-l px-5 py-3"
            />

            <SortableTableHeader
              sortKey="activeSurveys"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('projects.list.table.activeSurveys')}
              className="border-border/30 w-[11%] min-w-0 border-l px-5 py-3"
            />

            <SortableTableHeader
              sortKey="responses"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('projects.list.table.responses')}
              className="border-border/30 w-[12%] min-w-0 border-l px-5 py-3"
            />

            <SortableTableHeader
              sortKey="updated"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('projects.list.table.updated')}
              className="border-border/30 hidden w-[9%] min-w-0 border-l px-4 py-3 xl:table-cell"
            />

            <TableHead className="w-[4%] min-w-12 shrink-0 px-2 py-3" aria-hidden />
          </TableRow>
        </TableHeader>

        <TableBody>
          {projects.map((project) => (
            <ProjectTableRow
              key={project.id}
              project={project}
              now={now}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
