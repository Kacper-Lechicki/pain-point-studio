import type { useTranslations } from 'next-intl';

import type { QuestionAnswerData, QuestionType } from '@/features/surveys/types';

export function computeInsight(
  type: QuestionType,
  answers: QuestionAnswerData[],
  config: Record<string, unknown>,
  t: ReturnType<typeof useTranslations>
): string | null {
  if (answers.length === 0) {
    return null;
  }

  switch (type) {
    case 'multiple_choice': {
      const counts = new Map<string, number>();

      for (const a of answers) {
        const selected = (a.value.selected as string[]) ?? [];

        for (const option of selected) {
          counts.set(option, (counts.get(option) ?? 0) + 1);
        }

        const other = a.value.other as string | undefined;

        if (other) {
          const otherKey = `${t('surveys.stats.otherLabel' as Parameters<typeof t>[0])}: ${other}`;
          counts.set(otherKey, (counts.get(otherKey) ?? 0) + 1);
        }
      }

      if (counts.size === 0) {
        return null;
      }

      let topCount = 0;

      for (const [, count] of counts) {
        if (count > topCount) {
          topCount = count;
        }
      }

      const topOptions = Array.from(counts.entries())
        .filter(([, count]) => count === topCount)
        .map(([option]) => option);

      const totalSelections = Array.from(counts.values()).reduce((s, c) => s + c, 0);
      const pct = Math.round((topCount / totalSelections) * 100);

      if (topOptions.length > 1) {
        return t(
          'surveys.stats.insightTiedChoices' as Parameters<typeof t>[0],
          { options: topOptions.join(', '), pct } as never
        );
      }

      return t(
        'surveys.stats.insightTopChoice' as Parameters<typeof t>[0],
        { option: topOptions[0], pct } as never
      );
    }

    case 'rating_scale': {
      let sum = 0;
      let count = 0;

      for (const a of answers) {
        const rating = a.value.rating as number;

        if (typeof rating === 'number') {
          sum += rating;
          count++;
        }
      }

      if (count === 0) {
        return null;
      }

      const avg = (sum / count).toFixed(1);
      const scaleMax = (config.max as number) ?? 5;

      return t(
        'surveys.stats.insightAvgRating' as Parameters<typeof t>[0],
        { value: avg, max: scaleMax } as never
      );
    }

    case 'yes_no': {
      const yesCount = answers.filter((a) => a.value.answer === true).length;
      const noCount = answers.filter((a) => a.value.answer === false).length;
      const total = yesCount + noCount;

      if (total === 0) {
        return null;
      }

      if (yesCount === noCount) {
        return t('surveys.stats.insightEqualSplit' as Parameters<typeof t>[0]);
      }

      const majorityYes = yesCount > noCount;
      const pct = Math.round(((majorityYes ? yesCount : noCount) / total) * 100);

      return t(
        'surveys.stats.insightMajority' as Parameters<typeof t>[0],
        {
          label: majorityYes ? t('surveys.stats.yesLabel') : t('surveys.stats.noLabel'),
          pct,
        } as never
      );
    }

    case 'open_text':
    case 'short_text':
      return null;

    default:
      return null;
  }
}
