import { NextRequest, NextResponse } from 'next/server';

import { ROUTES } from '@/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const SAFE_REDIRECT_PREFIXES = [
  ROUTES.common.dashboard,
  ROUTES.common.settings,
  ROUTES.settings.connectedAccounts,
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
        if (!data.user.email) {
          const signInUrl = new URL(`/${locale}${ROUTES.auth.signIn}`, request.url);

          signInUrl.searchParams.set('error', 'callbackError');

          return NextResponse.redirect(signInUrl);
        }

        if (data.user.identities && data.user.identities.length === 1) {
          const admin = createAdminClient();

          const { data: duplicateUserId } = await admin.rpc('find_user_by_email_excluding', {
            lookup_email: data.user.email,
            exclude_id: data.user.id,
          });

          if (duplicateUserId) {
            try {
              await admin.rpc('merge_user_data', {
                from_user_id: duplicateUserId,
                to_user_id: data.user.id,
              });

              await admin.auth.admin.deleteUser(duplicateUserId);
            } catch {}
          }
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!profile) {
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
              : null;

      if (toastKey) {
        redirectUrl.searchParams.set('toast', toastKey);
      }

      return NextResponse.redirect(redirectUrl);
    }

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

    if (
      (error.code && EXPIRED_CODES.has(error.code)) ||
      error.message?.includes('expired') ||
      error.message?.includes('invalid')
    ) {
      callbackErrorKey = 'linkExpired';
    }

    if (isLinkingFlow) {
      const settingsUrl = new URL(`/${locale}${ROUTES.settings.connectedAccounts}`, request.url);

      settingsUrl.searchParams.set('error', callbackErrorKey);

      return NextResponse.redirect(settingsUrl);
    }
  }

  const signInUrl = new URL(`/${locale}${ROUTES.auth.signIn}`, request.url);

  signInUrl.searchParams.set('error', callbackErrorKey);

  return NextResponse.redirect(signInUrl);
}
