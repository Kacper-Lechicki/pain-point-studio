'use client';

import { useState, useSyncExternalStore } from 'react';

import { CircleUserRound, KeyRound, Link2, Mail, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ConnectedAccounts } from '@/app/[locale]/(dashboard)/settings/_components/connected-accounts';
import { DangerZone } from '@/app/[locale]/(dashboard)/settings/_components/danger-zone';
import { EmailForm } from '@/app/[locale]/(dashboard)/settings/_components/email-form';
import { PasswordForm } from '@/app/[locale]/(dashboard)/settings/_components/password-form';
import { ProfileForm } from '@/app/[locale]/(dashboard)/settings/_components/profile-form';
import { SettingsHeader } from '@/app/[locale]/(dashboard)/settings/_components/settings-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProfileData } from '@/features/settings/actions';

const SECTIONS = [
  { value: 'profile', icon: CircleUserRound },
  { value: 'email', icon: Mail },
  { value: 'password', icon: KeyRound },
  { value: 'connectedAccounts', icon: Link2 },
  { value: 'dangerZone', icon: Trash2 },
] as const;

type SectionValue = (typeof SECTIONS)[number]['value'];

let clientMounted = false;
const mountedListeners = new Set<() => void>();

function subscribeMounted(callback: () => void) {
  mountedListeners.add(callback);

  if (!clientMounted) {
    queueMicrotask(() => {
      clientMounted = true;
      mountedListeners.forEach((cb) => cb());
    });
  }

  return () => {
    mountedListeners.delete(callback);
  };
}

function getMountedSnapshot() {
  return clientMounted;
}

function getMountedServerSnapshot() {
  return false;
}

function useMounted() {
  return useSyncExternalStore(subscribeMounted, getMountedSnapshot, getMountedServerSnapshot);
}

interface SettingsPageProps {
  profile: ProfileData;
}

const SettingsPage = ({ profile }: SettingsPageProps) => {
  const t = useTranslations('settings');
  const mounted = useMounted();
  const [activeSection, setActiveSection] = useState<SectionValue>('profile');

  const sectionContent: Record<SectionValue, React.ReactNode> = {
    profile: <ProfileForm profile={profile} />,
    email: <EmailForm currentEmail={profile.email} />,
    password: <PasswordForm hasPassword={profile.hasPassword} />,
    connectedAccounts: <ConnectedAccounts identities={profile.identities} />,
    dangerZone: <DangerZone userEmail={profile.email} />,
  };

  if (!mounted) {
    return (
      <div className="mx-auto w-full">
        <div className="space-y-8">
          <SettingsHeader />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full">
      <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div className="sticky top-24 hidden w-60 shrink-0 flex-col gap-6 lg:flex">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground text-xs">{t('description')}</p>
          </div>

          <nav className="flex w-full flex-col gap-2" data-testid="settings-nav">
            {SECTIONS.map(({ value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                data-section={value}
                data-state={activeSection === value ? 'active' : 'inactive'}
                onClick={() => setActiveSection(value)}
                className="text-muted-foreground hover:border-border hover:text-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground flex h-9 min-h-9 w-full items-center justify-start gap-2.5 rounded-lg border border-dashed border-transparent px-3 text-sm font-medium transition-all data-[state=active]:border-solid data-[state=active]:border-transparent"
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {t(`nav.${value}`)}
              </button>
            ))}
          </nav>
        </div>

        <div className="w-full space-y-6 lg:hidden">
          <SettingsHeader />

          <Select value={activeSection} onValueChange={(v) => setActiveSection(v as SectionValue)}>
            <SelectTrigger className="w-full" data-testid="settings-nav-select">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {SECTIONS.map(({ value, icon: Icon }) => (
                <SelectItem key={value} value={value} data-section={value}>
                  <Icon className="size-4" />
                  {t(`nav.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:border-border/50 sm:bg-card/80 min-w-0 flex-1 rounded-xl sm:border sm:p-6 sm:shadow-xl sm:backdrop-blur-sm lg:p-10">
          {sectionContent[activeSection]}
        </div>
      </div>
    </div>
  );
};

export { SettingsPage };
