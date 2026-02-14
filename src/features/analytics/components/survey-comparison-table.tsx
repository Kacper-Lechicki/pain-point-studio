'use client';

import { useMemo, useState } from 'react';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { ROUTES } from '@/config/routes';
import { SurveyStatusBadge } from '@/features/surveys/components/dashboard/survey-status-badge';
import { DATE_FORMAT_SHORT } from '@/features/surveys/config';
import type { SurveyStatus } from '@/features/surveys/types';
import Link from '@/i18n/link';

type SortColumn = 'title' | 'completedCount' | 'completionRate' | 'questionCount' | 'createdAt';
type SortDir = 'asc' | 'desc';

interface SurveyRow {
  id: string;
  title: string;
  status: string;
  category: string;
  completedCount: number;
  completionRate: number;
  questionCount: number;
  createdAt: string;
}

interface SurveyComparisonTableProps {
  surveys: SurveyRow[];
}

export const SurveyComparisonTable = ({ surveys }: SurveyComparisonTableProps) => {
  const t = useTranslations('analytics');
  const tCategories = useTranslations('surveys.categories');
  const format = useFormatter();

  const [sortCol, setSortCol] = useState<SortColumn>('completedCount');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const copy = [...surveys];

    copy.sort((a, b) => {
      let cmp = 0;

      switch (sortCol) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'completedCount':
          cmp = a.completedCount - b.completedCount;
          break;
        case 'completionRate':
          cmp = a.completionRate - b.completionRate;
          break;
        case 'questionCount':
          cmp = a.questionCount - b.questionCount;
          break;
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });

    return copy;
  }, [surveys, sortCol, sortDir]);

  const toggleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  const translateCategory = (category: string): string => {
    try {
      return tCategories(category as Parameters<typeof tCategories>[0]);
    } catch {
      return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  const formatDate = (iso: string) => format.dateTime(new Date(iso), DATE_FORMAT_SHORT);

  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-border/50 border-b">
            <Th col="title" label={t('columnTitle')} toggleSort={toggleSort}>
              <SortIcon col="title" sortCol={sortCol} sortDir={sortDir} />
            </Th>
            <th className="text-muted-foreground px-2 py-2 text-left text-xs font-medium">
              {t('columnStatus')}
            </th>
            <th className="text-muted-foreground px-2 py-2 text-left text-xs font-medium">
              {t('columnCategory')}
            </th>
            <Th col="completedCount" label={t('columnResponses')} toggleSort={toggleSort}>
              <SortIcon col="completedCount" sortCol={sortCol} sortDir={sortDir} />
            </Th>
            <Th col="completionRate" label={t('columnCompletionRate')} toggleSort={toggleSort}>
              <SortIcon col="completionRate" sortCol={sortCol} sortDir={sortDir} />
            </Th>
            <Th col="questionCount" label={t('columnQuestions')} toggleSort={toggleSort}>
              <SortIcon col="questionCount" sortCol={sortCol} sortDir={sortDir} />
            </Th>
            <Th col="createdAt" label={t('columnCreated')} toggleSort={toggleSort}>
              <SortIcon col="createdAt" sortCol={sortCol} sortDir={sortDir} />
            </Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((survey) => (
            <tr
              key={survey.id}
              className="border-border/30 hover:bg-muted/30 border-b transition-colors"
            >
              <td className="px-2 py-2.5">
                <Link
                  href={`${ROUTES.dashboard.surveysStats}/${survey.id}`}
                  className="text-foreground font-medium hover:underline"
                >
                  {survey.title}
                </Link>
              </td>
              <td className="px-2 py-2.5">
                <SurveyStatusBadge status={survey.status as SurveyStatus} />
              </td>
              <td className="text-muted-foreground px-2 py-2.5 text-xs">
                {translateCategory(survey.category)}
              </td>
              <td className="px-2 py-2.5 tabular-nums">{survey.completedCount}</td>
              <td className="px-2 py-2.5 tabular-nums">{survey.completionRate}%</td>
              <td className="px-2 py-2.5 tabular-nums">{survey.questionCount}</td>
              <td className="text-muted-foreground px-2 py-2.5 text-xs">
                {formatDate(survey.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface SortIconProps {
  col: SortColumn;
  sortCol: SortColumn;
  sortDir: SortDir;
}

function SortIcon({ col, sortCol, sortDir }: SortIconProps) {
  if (sortCol !== col) {
    return <ArrowUpDown className="size-3 opacity-40" aria-hidden />;
  }

  return sortDir === 'asc' ? (
    <ArrowUp className="size-3" aria-hidden />
  ) : (
    <ArrowDown className="size-3" aria-hidden />
  );
}

interface ThProps {
  col: SortColumn;
  label: string;
  toggleSort: (col: SortColumn) => void;
  children: React.ReactNode;
}

function Th({ col, label, toggleSort, children }: ThProps) {
  return (
    <th className="px-2 py-2 text-left text-xs font-medium">
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
        onClick={() => toggleSort(col)}
      >
        {label}
        {children}
      </button>
    </th>
  );
}
