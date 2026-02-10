import { ROUTES, SECTION_TO_HASH } from '@/config/routes';
import { defaultLocale } from '@/i18n/constants';

export { ROUTES, SECTION_TO_HASH };

export function url(path: string, hash?: string): string {
  return `/${defaultLocale}${path}${hash ? `#${hash}` : ''}`;
}
