import { NextRequest, NextResponse } from 'next/server';

import { ROUTES } from '@/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const SAFE_REDIRECT_PREFIXES = [
  ROUTES.common.dashboard,
  ROUTES.common.settings,
  ROUTES.settings.connectedAccounts,
  ROUTES.auth.updatePassword,
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

  const errorRedirect = (key: string) => {
    const isLinkingFlow = next?.includes('/settings');

    const base = isLinkingFlow
      ? `/${locale}${ROUTES.settings.connectedAccounts}`
      : `/${locale}${ROUTES.auth.signIn}`;

    const url = new URL(base, request.url);

    url.searchParams.set('error', key);

    return NextResponse.redirect(url);
  };

  if (!code) {
    return errorRedirect('callbackError');
  }

  try {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return handleAuthError(error, request, locale, next);
    }

    if (!data?.user?.email) {
      return errorRedirect('callbackError');
    }

    const user = data.user;

    // Merge duplicate email-only accounts when a new OAuth identity is created
    if (user.identities && user.identities.length === 1) {
      try {
        const admin = createAdminClient();

        const { data: duplicateUserId } = await admin.rpc('find_user_by_email_excluding', {
          lookup_email: user.email!,
          exclude_id: user.id,
        });

        if (duplicateUserId) {
          await admin.rpc('merge_user_data', {
            from_user_id: duplicateUserId,
            to_user_id: user.id,
          });

          await admin.auth.admin.deleteUser(duplicateUserId);
        }
      } catch {
        // Non-fatal: merge failure shouldn't block sign-in
      }
    }

    // Ensure profile exists (fallback for when auth trigger didn't fire)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      const { error: upsertError } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          full_name: (user.user_metadata?.full_name as string) ?? '',
          avatar_url: (user.user_metadata?.avatar_url as string) ?? '',
        },
        { onConflict: 'id' }
      );

      if (upsertError) {
        return errorRedirect('profileCreationFailed');
      }
    } else {
      const providerAvatar = user.user_metadata?.avatar_url as string | undefined;

      if (providerAvatar && providerAvatar !== profile.avatar_url) {
        await supabase.from('profiles').update({ avatar_url: providerAvatar }).eq('id', user.id);
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
            : null;

    if (toastKey) {
      redirectUrl.searchParams.set('toast', toastKey);
    }

    return NextResponse.redirect(redirectUrl);
  } catch {
    // Catch-all: any unhandled error redirects gracefully instead of 500
    return errorRedirect('callbackError');
  }
}

function handleAuthError(
  error: { code?: string | undefined; message?: string | undefined },
  request: NextRequest,
  locale: string,
  next: string | null
) {
  if (error.code === 'access_denied') {
    const signInUrl = new URL(`/${locale}${ROUTES.auth.signIn}`, request.url);

    return NextResponse.redirect(signInUrl);
  }

  const isLinkingFlow = next?.includes('/settings');

  const IDENTITY_LINK_CODES = new Set([
    'identity_already_exists',
    'manual_linking_disabled',
    'identity_not_found',
  ]);

  if (isLinkingFlow && error.code && IDENTITY_LINK_CODES.has(error.code)) {
    const settingsUrl = new URL(`/${locale}${ROUTES.settings.connectedAccounts}`, request.url);

    settingsUrl.searchParams.set('error', error.code);

    return NextResponse.redirect(settingsUrl);
  }

  const EXPIRED_CODES = new Set(['otp_expired', 'flow_state_expired', 'bad_code_verifier']);

  let callbackErrorKey = 'callbackError';

  if (
    (error.code && EXPIRED_CODES.has(error.code)) ||
    error.message?.includes('expired') ||
    error.message?.includes('invalid')
  ) {
    callbackErrorKey = 'linkExpired';
  }

  const base = isLinkingFlow
    ? `/${locale}${ROUTES.settings.connectedAccounts}`
    : `/${locale}${ROUTES.auth.signIn}`;
  const url = new URL(base, request.url);

  url.searchParams.set('error', callbackErrorKey);

  return NextResponse.redirect(url);
}
