import { env } from '@/lib/common/env';

/** Build the locale-aware auth callback URL used by server-side auth flows. */
export function getAuthCallbackUrl(locale: string, next?: string): string {
  const base = `${env.NEXT_PUBLIC_APP_URL}/${locale}/auth/callback`;

  return next ? `${base}?next=/${locale}${next}` : base;
}
