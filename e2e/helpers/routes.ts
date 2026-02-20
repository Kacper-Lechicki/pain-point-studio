import { ROUTES } from '@/config/routes';
import { defaultLocale } from '@/i18n/constants';

export { ROUTES };

export function url(path: string, hash?: string): string {
  return `/${defaultLocale}${path}${hash ? `#${hash}` : ''}`;
}
