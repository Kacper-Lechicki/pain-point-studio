import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { SortableTableHeader } from '@/features/surveys/components/dashboard/sortable-table-header';
import { SurveyListRow } from '@/features/surveys/components/dashboard/survey-list-row';
import type { SurveySortBy } from '@/features/surveys/components/dashboard/survey-list-toolbar';

interface SurveyListTableProps {
  surveys: UserSurvey[];
  selectedId: string | null;
  sortBy: SurveySortBy;
  sortDir: 'asc' | 'desc';
  now: Date;
  onSortByColumn: (key: SurveySortBy) => void;
  onSelect: (surveyId: string) => void;
  onStatusChange: (surveyId: string, action: string) => void;
  /** When true, uses project-consistent columns: Title (44%), Status, Responses, Last Response, Activity. */
  isProjectContext?: boolean | undefined;
  /** Set of selected survey IDs for bulk selection. */
  selectedIds?: Set<string> | undefined;
  /** Toggle bulk selection for a survey ID. */
  onToggleBulkSelect?: ((id: string) => void) | undefined;
  /** Select all surveys on the current page. */
  onSelectAll?: ((surveys: UserSurvey[]) => void) | undefined;
  /** Clear the bulk selection. */
  onClearSelection?: (() => void) | undefined;
}

export function SurveyListTable({
  surveys,
  selectedId,
  sortBy,
  sortDir,
  now,
  onSortByColumn,
  onSelect,
  onStatusChange,
  isProjectContext,
  selectedIds,
  onToggleBulkSelect,
  onSelectAll,
  onClearSelection,
}: SurveyListTableProps) {
  const t = useTranslations();

  const allSelected = useMemo(
    () =>
      !!selectedIds &&
      selectedIds.size > 0 &&
      surveys.length > 0 &&
      surveys.every((s) => selectedIds.has(s.id)),
    [selectedIds, surveys]
  );

  const someSelected = useMemo(
    () => !!selectedIds && selectedIds.size > 0 && !allSelected,
    [selectedIds, allSelected]
  );

  return (
    <div className="border-border/50 bg-card overflow-hidden rounded-lg border">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
            {onToggleBulkSelect && (
              <TableHead className="w-10 shrink-0 px-3 py-3">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onSelectAll?.(surveys);
                    } else {
                      onClearSelection?.();
                    }
                  }}
                  aria-label={t('surveys.dashboard.bulk.selectAll')}
                />
              </TableHead>
            )}

            <SortableTableHeader
              sortKey="title"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('surveys.dashboard.table.title')}
              className={isProjectContext ? 'w-[44%]' : 'w-[30%]'}
            />

            <SortableTableHeader
              sortKey="status"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('surveys.dashboard.table.status')}
              className={
                isProjectContext ? 'border-border/30 w-[14%] border-l' : 'border-border/30 border-l'
              }
              centered
            />

            <SortableTableHeader
              sortKey="responses"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('surveys.dashboard.table.responses')}
              className={
                isProjectContext ? 'border-border/30 w-[14%] border-l' : 'border-border/30 border-l'
              }
            />

            {!isProjectContext && (
              <SortableTableHeader
                sortKey="completion"
                currentSortKey={sortBy}
                sortDir={sortDir}
                onSort={onSortByColumn}
                label={t('surveys.dashboard.table.completion')}
                className="border-border/30 hidden border-l lg:table-cell"
              />
            )}

            <SortableTableHeader
              sortKey="lastResponse"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('surveys.dashboard.table.lastResponse')}
              className={
                isProjectContext
                  ? 'border-border/30 hidden w-[14%] border-l lg:table-cell'
                  : 'border-border/30 hidden border-l xl:table-cell'
              }
            />

            <SortableTableHeader
              sortKey="activity"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('surveys.dashboard.table.activity')}
              className={
                isProjectContext
                  ? 'border-border/30 hidden w-[14%] border-l xl:table-cell'
                  : 'border-border/30 hidden border-l 2xl:table-cell'
              }
              centered
            />

            <TableHead className={isProjectContext ? 'w-12' : 'w-10'} aria-hidden />
          </TableRow>
        </TableHeader>

        <TableBody>
          {surveys.map((survey: UserSurvey) => (
            <SurveyListRow
              key={survey.id}
              survey={survey}
              now={now}
              isSelected={selectedId === survey.id}
              onSelect={onSelect}
              onStatusChange={onStatusChange}
              variant="table"
              isProjectContext={isProjectContext}
              isBulkSelected={selectedIds?.has(survey.id) ?? false}
              onToggleBulkSelect={onToggleBulkSelect}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
