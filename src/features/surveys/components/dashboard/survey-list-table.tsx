import { useTranslations } from 'next-intl';

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';

import { SortableTableHeader } from './sortable-table-header';
import { SurveyListRow } from './survey-list-row';
import type { SurveySortBy } from './survey-list-toolbar';

interface SurveyListTableProps {
  surveys: UserSurvey[];
  selectedId: string | null;
  sortBy: SurveySortBy;
  sortDir: 'asc' | 'desc';
  now: Date;
  onSortByColumn: (key: SurveySortBy) => void;
  onSelect: (surveyId: string) => void;
  onStatusChange: (surveyId: string, action: string) => void;
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
}: SurveyListTableProps) {
  const t = useTranslations();

  return (
    <div className="border-border/50 overflow-hidden rounded-lg border">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <SortableTableHeader
              sortKey="title"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('surveys.dashboard.table.title')}
              className="w-[30%]"
            />
            <SortableTableHeader
              sortKey="status"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('surveys.dashboard.table.status')}
              className="border-border/30 border-l"
              centered
            />
            <SortableTableHeader
              sortKey="responses"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('surveys.dashboard.table.responses')}
              className="border-border/30 border-l"
            />
            <SortableTableHeader
              sortKey="questions"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('surveys.dashboard.table.questions')}
              className="border-border/30 hidden border-l lg:table-cell"
            />
            <SortableTableHeader
              sortKey="lastResponse"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('surveys.dashboard.table.lastResponse')}
              className="border-border/30 hidden border-l xl:table-cell"
            />
            <SortableTableHeader
              sortKey="activity"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('surveys.dashboard.table.activity')}
              className="border-border/30 hidden border-l 2xl:table-cell"
              centered
            />
            <TableHead className="w-10" aria-hidden />
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
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
