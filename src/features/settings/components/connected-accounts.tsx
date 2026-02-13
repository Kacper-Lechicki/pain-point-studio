'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Info, KeyRound, LinkIcon, Unlink } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Spinner } from '@/components/ui/spinner';
import { OAUTH_PROVIDERS, OAuthProviderConfig } from '@/features/auth/config';
import { unlinkIdentity } from '@/features/settings/actions';
import { SettingsSectionHeader } from '@/features/settings/components/settings-section-header';
import { useLinkIdentity } from '@/features/settings/hooks/use-link-identity';
import { useFormAction } from '@/hooks/common/use-form-action';
import type { MessageKey } from '@/i18n/types';

interface IdentityData {
  provider: string;
  email: string | undefined;
  identityId: string;
}

interface ConnectedAccountsProps {
  identities: IdentityData[];
  hasPassword: boolean;
}

const ConnectedAccounts = ({ identities, hasPassword }: ConnectedAccountsProps) => {
  const t = useTranslations();
  const router = useRouter();
  const [unlinkTarget, setUnlinkTarget] = useState<{
    identity: IdentityData;
    config: OAuthProviderConfig;
  } | null>(null);

  const oauthIdentities = identities.filter((identity) => identity.provider !== 'email');
  const totalLoginMethods = oauthIdentities.length + (hasPassword ? 1 : 0);
  const canUnlink = totalLoginMethods >= 2;

  const { linkingProvider, linkProvider } = useLinkIdentity();

  const { isLoading: isUnlinking, execute } = useFormAction({
    successMessage: 'settings.connectedAccounts.disconnected' as MessageKey,
    unexpectedErrorMessage: 'settings.errors.unexpected' as MessageKey,
    onSuccess: () => {
      setUnlinkTarget(null);
      router.refresh();
    },
    onError: () => setUnlinkTarget(null),
  });

  async function handleUnlinkConfirm() {
    if (!unlinkTarget) {
      return;
    }

    await execute(unlinkIdentity, {
      identityId: unlinkTarget.identity.identityId,
      provider: unlinkTarget.identity.provider,
    });
  }

  const isBusy = linkingProvider !== null || isUnlinking;

  return (
    <section className="space-y-8">
      <SettingsSectionHeader
        title={t('settings.connectedAccounts.title')}
        description={t('settings.connectedAccounts.description')}
      />

      <div className="space-y-3">
        <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border p-4">
          <div className="flex min-w-0 items-center gap-3">
            <KeyRound className="size-5 shrink-0" aria-hidden="true" />

            <div className="min-w-0">
              <p className="text-sm font-medium">{t('settings.password.title')}</p>

              <p className="text-muted-foreground text-xs">
                {hasPassword
                  ? t('settings.connectedAccounts.passwordSet')
                  : t('settings.connectedAccounts.passwordNotSet')}
              </p>
            </div>
          </div>

          <Badge variant="secondary" className="hidden sm:inline-flex">
            {hasPassword
              ? t('settings.connectedAccounts.connected')
              : t('settings.connectedAccounts.notConnected')}
          </Badge>
        </div>

        {OAUTH_PROVIDERS.map((providerConfig) => {
          const linkedIdentity = oauthIdentities.find((i) => i.provider === providerConfig.id);
          const isConnected = !!linkedIdentity;
          const isLinkingThis = linkingProvider === providerConfig.id;
          const Icon = providerConfig.icon;

          return (
            <div
              key={providerConfig.id}
              className="bg-muted/30 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Icon className="size-5 shrink-0" aria-hidden="true" />

                <div className="min-w-0">
                  <p className="text-sm font-medium">{t(providerConfig.label)}</p>

                  <p className="text-muted-foreground truncate text-xs">
                    {isConnected && linkedIdentity.email
                      ? linkedIdentity.email
                      : t('settings.connectedAccounts.notConnected')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Button
                    type="button"
                    variant="ghostDestructive"
                    size="icon-sm"
                    disabled={!canUnlink || isBusy}
                    onClick={() =>
                      setUnlinkTarget({ identity: linkedIdentity, config: providerConfig })
                    }
                    aria-label={t('settings.connectedAccounts.disconnect')}
                  >
                    <Unlink className="size-4" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => linkProvider(providerConfig.id)}
                  >
                    {isLinkingThis ? (
                      <Spinner />
                    ) : (
                      <LinkIcon className="size-3.5" aria-hidden="true" />
                    )}
                    {t('settings.connectedAccounts.connect')}
                  </Button>
                )}

                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {isConnected
                    ? t('settings.connectedAccounts.connected')
                    : t('settings.connectedAccounts.notConnected')}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {!canUnlink && oauthIdentities.length > 0 && (
        <div className="text-muted-foreground flex items-start gap-2 text-xs">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            {hasPassword
              ? t('settings.connectedAccounts.cannotUnlinkOnlyOAuth')
              : t('settings.connectedAccounts.cannotUnlinkHint')}
          </p>
        </div>
      )}

      <ConfirmDialog
        open={unlinkTarget !== null}
        onOpenChange={(open) => !open && setUnlinkTarget(null)}
        onConfirm={handleUnlinkConfirm}
        title={
          unlinkTarget
            ? t('settings.connectedAccounts.confirmDisconnectTitle', {
                provider: t(unlinkTarget.config.label),
              })
            : ''
        }
        description={
          unlinkTarget
            ? t('settings.connectedAccounts.confirmDisconnectDescription', {
                provider: t(unlinkTarget.config.label),
              })
            : ''
        }
        confirmLabel={t('settings.connectedAccounts.disconnect')}
      />
    </section>
  );
};

export { ConnectedAccounts };
