import { useTranslations } from 'next-intl';

import { SortableTableHeader } from '@/components/ui/sortable-table-header';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import type { ProjectSortBy } from '@/features/projects/components/project-list-toolbar';
import { ProjectTableRow } from '@/features/projects/components/project-table-row';

interface ProjectListTableProps {
  projects: ProjectWithMetrics[];
  selectedId: string | null;
  sortBy: ProjectSortBy;
  sortDir: 'asc' | 'desc';
  now: Date;
  onSortByColumn: (key: ProjectSortBy) => void;
  onSelect: (projectId: string) => void;
  onEdit: (project: ProjectWithMetrics) => void;
  onArchive: (project: ProjectWithMetrics) => void;
  onDelete: (project: ProjectWithMetrics) => void;
}

export function ProjectListTable({
  projects,
  selectedId,
  sortBy,
  sortDir,
  now,
  onSortByColumn,
  onSelect,
  onEdit,
  onArchive,
  onDelete,
}: ProjectListTableProps) {
  const t = useTranslations();

  return (
    <div className="border-border/50 overflow-hidden rounded-lg border">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <SortableTableHeader
              sortKey="name"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('projects.list.table.name')}
              className="w-[30%]"
            />

            <SortableTableHeader
              sortKey="status"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('projects.list.table.status')}
              className="border-border/30 border-l"
              centered
            />

            <SortableTableHeader
              sortKey="surveys"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('projects.list.table.surveys')}
              className="border-border/30 border-l"
            />

            <SortableTableHeader
              sortKey="responses"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('projects.list.table.responses')}
              className="border-border/30 border-l"
            />

            <SortableTableHeader
              sortKey="updated"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('projects.list.table.updated')}
              className="border-border/30 hidden border-l xl:table-cell"
            />

            <TableHead className="w-10" aria-hidden />
          </TableRow>
        </TableHeader>

        <TableBody>
          {projects.map((project) => (
            <ProjectTableRow
              key={project.id}
              project={project}
              isSelected={selectedId === project.id}
              now={now}
              onSelect={onSelect}
              onEdit={onEdit}
              onArchive={onArchive}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
