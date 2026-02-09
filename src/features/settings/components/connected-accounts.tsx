'use client';

import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { OAUTH_PROVIDERS } from '@/features/auth/config';

interface ConnectedAccountsProps {
  identities: { provider: string; email: string | undefined }[];
}

const ConnectedAccounts = ({ identities }: ConnectedAccountsProps) => {
  const t = useTranslations();

  const oauthIdentities = identities.filter((identity) => identity.provider !== 'email');

  return (
    <section className="space-y-8">
      <div className="border-border/40 space-y-1 border-b pb-6">
        <h2 className="text-lg font-semibold">{t('settings.connectedAccounts.title')}</h2>

        <p className="text-muted-foreground text-sm">
          {t('settings.connectedAccounts.description')}
        </p>
      </div>

      {oauthIdentities.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t('settings.connectedAccounts.noAccounts')}
        </p>
      ) : (
        <div className="space-y-4">
          {oauthIdentities.map((identity) => {
            const providerConfig = OAUTH_PROVIDERS.find((p) => p.id === identity.provider);

            if (!providerConfig) {
              return null;
            }

            const Icon = providerConfig.icon;

            return (
              <div
                key={identity.provider}
                className="bg-muted/30 md:hover:bg-muted/50 flex flex-wrap items-center justify-between gap-2 rounded-xl border p-4 transition-all md:hover:shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Icon className="size-5 shrink-0" aria-hidden="true" />

                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t(providerConfig.label)}</p>

                    {identity.email && (
                      <p className="text-muted-foreground truncate text-xs">{identity.email}</p>
                    )}
                  </div>
                </div>

                <Badge variant="secondary">{t('settings.connectedAccounts.connected')}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export { ConnectedAccounts };
