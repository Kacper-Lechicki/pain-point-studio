import type { ResponseStatus } from '@/features/surveys/types/response-list';

interface ResponseStatusConfig {
  labelKey: string;
  descriptionKey: string;
  ariaLabelKey: string;
  badge: {
    variant: 'default' | 'secondary' | 'outline';
    className: string;
  };
}

/** Maps each response status to its i18n keys and badge styling for use with StatusBadge. */
export const RESPONSE_STATUS_CONFIG: Record<ResponseStatus, ResponseStatusConfig> = {
  completed: {
    labelKey: 'surveys.stats.responseList.status_completed',
    descriptionKey: 'surveys.stats.responseList.statusInfo.completed',
    ariaLabelKey: 'surveys.stats.responseList.statusInfo.ariaLabel',
    badge: {
      variant: 'outline',
      className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
    },
  },
  in_progress: {
    labelKey: 'surveys.stats.responseList.status_in_progress',
    descriptionKey: 'surveys.stats.responseList.statusInfo.in_progress',
    ariaLabelKey: 'surveys.stats.responseList.statusInfo.ariaLabel',
    badge: {
      variant: 'outline',
      className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25',
    },
  },
  abandoned: {
    labelKey: 'surveys.stats.responseList.status_abandoned',
    descriptionKey: 'surveys.stats.responseList.statusInfo.abandoned',
    ariaLabelKey: 'surveys.stats.responseList.statusInfo.ariaLabel',
    badge: {
      variant: 'outline',
      className: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/25',
    },
  },
};
