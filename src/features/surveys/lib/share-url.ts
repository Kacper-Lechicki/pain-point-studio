import { env } from '@/lib/common/env';

/** Build the public respondent URL for a survey. */
export function getSurveyShareUrl(locale: string, slug: string): string {
  return `${env.NEXT_PUBLIC_APP_URL}/${locale}/r/${slug}`;
}
