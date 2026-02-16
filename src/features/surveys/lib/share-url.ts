import { env } from '@/lib/common/env';

export function getSurveyShareUrl(locale: string, slug: string): string {
  return `${env.NEXT_PUBLIC_APP_URL}/${locale}/r/${slug}`;
}
