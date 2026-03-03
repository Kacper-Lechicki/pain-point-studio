import { NextRequest, NextResponse } from 'next/server';

import { ROUTES } from '@/config';
import { createClient } from '@/lib/supabase/server';

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

  let callbackErrorKey = 'callbackError';

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (data?.user) {
        // Guard against OAuth providers that don't return an email.
        if (!data.user.email) {
          const signInUrl = new URL(`/${locale}${ROUTES.auth.signIn}`, request.url);
          signInUrl.searchParams.set('error', 'callbackError');

          return NextResponse.redirect(signInUrl);
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!profile) {
          // Trigger on auth.users may not have fired (e.g. Supabase cloud
          // restrictions on auth-schema triggers). Ensure a profile row exists.
          const { error: upsertError } = await supabase.from('profiles').upsert(
            {
              id: data.user.id,
              full_name: (data.user.user_metadata?.full_name as string) ?? '',
              avatar_url: (data.user.user_metadata?.avatar_url as string) ?? '',
            },
            { onConflict: 'id' }
          );

          if (upsertError) {
            const signInUrl = new URL(`/${locale}${ROUTES.auth.signIn}`, request.url);
            signInUrl.searchParams.set('error', 'profileCreationFailed');

            return NextResponse.redirect(signInUrl);
          }
        } else {
          // Sync avatar: if OAuth provider returned a newer avatar, update profile.
          const providerAvatar = data.user.user_metadata?.avatar_url as string | undefined;

          if (providerAvatar && providerAvatar !== profile.avatar_url) {
            await supabase
              .from('profiles')
              .update({ avatar_url: providerAvatar })
              .eq('id', data.user.id);
          }
        }
      }

      const fallbackPath = `/${locale}${ROUTES.common.dashboard}`;
      const redirectPath = getSafeRedirectPath(next, locale, fallbackPath);

      const redirectUrl = new URL(redirectPath, request.url);

      const toastKey =
        type === 'signup'
          ? 'emailConfirmed'
          : type === 'email_change'
            ? 'emailChangeConfirmed'
            : type === 'recovery'
              ? 'passwordResetReady'
              : 'signInSuccess';

      redirectUrl.searchParams.set('toast', toastKey);

      return NextResponse.redirect(redirectUrl);
    }

    // Map Supabase error to a specific key so the UI can show a helpful message.
    // Prefer structured error.code over fragile string matching on error.message.
    const EXPIRED_CODES = new Set(['otp_expired', 'flow_state_expired', 'bad_code_verifier']);

    if (
      (error.code && EXPIRED_CODES.has(error.code)) ||
      error.message?.includes('expired') ||
      error.message?.includes('invalid')
    ) {
      callbackErrorKey = 'linkExpired';
    }
  }

  const signInUrl = new URL(`/${locale}${ROUTES.auth.signIn}`, request.url);

  signInUrl.searchParams.set('error', callbackErrorKey);

  return NextResponse.redirect(signInUrl);
}
