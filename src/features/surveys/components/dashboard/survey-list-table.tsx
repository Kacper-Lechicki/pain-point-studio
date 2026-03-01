import { useTranslations } from 'next-intl';

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
}: SurveyListTableProps) {
  const t = useTranslations();

  return (
    <div className="border-border/50 bg-card overflow-hidden rounded-lg border">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
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
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
