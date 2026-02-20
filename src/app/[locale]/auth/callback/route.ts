import { NextRequest, NextResponse } from 'next/server';

import { ROUTES } from '@/config';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_CALLBACK_TYPES = ['signup', 'email_change'] as const;

type CallbackType = (typeof ALLOWED_CALLBACK_TYPES)[number];

function isValidCallbackType(value: string | null): value is CallbackType {
  return ALLOWED_CALLBACK_TYPES.includes(value as CallbackType);
}

const SAFE_REDIRECT_PREFIXES = [
  ROUTES.common.dashboard,
  ROUTES.common.settings,
  ROUTES.auth.updatePassword,
  ROUTES.profile.preview,
] as const;

function getSafeRedirectPath(next: string | null, locale: string, fallback: string): string {
  if (!next) {
    return fallback;
  }

  const withoutLocale = next.startsWith(`/${locale}/`)
    ? next.slice(`/${locale}`.length)
    : next.startsWith(`/${locale}`)
      ? next.slice(`/${locale}`.length) || '/'
      : next;

  const isSafe = SAFE_REDIRECT_PREFIXES.some(
    (prefix) => withoutLocale === prefix || withoutLocale.startsWith(`${prefix}/`)
  );

  return isSafe ? next : fallback;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');
  const type = requestUrl.searchParams.get('type');

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!profile) {
          // Trigger on auth.users may not have fired (e.g. Supabase cloud
          // restrictions on auth-schema triggers). Ensure a profile row exists.
          await supabase.from('profiles').upsert(
            {
              id: data.user.id,
              full_name: (data.user.user_metadata?.full_name as string) ?? '',
              avatar_url: (data.user.user_metadata?.avatar_url as string) ?? '',
            },
            { onConflict: 'id' }
          );
        } else if (
          profile.avatar_url &&
          profile.avatar_url !== data.user.user_metadata?.avatar_url
        ) {
          await supabase.auth.updateUser({
            data: { avatar_url: profile.avatar_url },
          });
        }
      }

      const fallbackPath = `/${locale}${ROUTES.common.dashboard}`;
      const redirectPath = getSafeRedirectPath(next, locale, fallbackPath);

      const redirectUrl = new URL(redirectPath, request.url);

      if (redirectPath === fallbackPath || (isValidCallbackType(type) && type === 'email_change')) {
        const toastKey =
          type === 'signup'
            ? 'emailConfirmed'
            : type === 'email_change'
              ? 'emailChangeConfirmed'
              : 'signInSuccess';

        redirectUrl.searchParams.set('toast', toastKey);
      }

      return NextResponse.redirect(redirectUrl);
    }
  }

  const signInUrl = new URL(`/${locale}${ROUTES.auth.signIn}`, request.url);

  signInUrl.searchParams.set('error', 'auth_callback_error');

  return NextResponse.redirect(signInUrl);
}
