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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileData } from '@/features/settings/actions';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';

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
  const isDesktop = useBreakpoint('lg');
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

  if (isDesktop) {
    return (
      <div className="mx-auto w-full">
        <div className="space-y-8">
          <SettingsHeader />

          <Tabs
            value={activeSection}
            onValueChange={(v) => setActiveSection(v as SectionValue)}
            orientation="vertical"
            data-testid="settings-nav"
          >
            <div className="flex flex-1 gap-8">
              <TabsList className="sticky top-24 flex h-fit w-48 shrink-0 flex-col gap-3 self-start bg-transparent">
                {SECTIONS.map(({ value, icon: Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    data-section={value}
                    className="data-[state=active]:bg-accent h-9! min-h-9 w-full justify-start gap-2 rounded-lg px-3 after:hidden data-[state=active]:shadow-none"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {t(`nav.${value}`)}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="border-border/50 bg-card/80 min-w-0 flex-1 rounded-xl border p-8 shadow-xl backdrop-blur-sm">
                {SECTIONS.map(({ value }) => (
                  <TabsContent key={value} value={value}>
                    {sectionContent[value]}
                  </TabsContent>
                ))}
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="space-y-6">
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

        <div className="sm:border-border/50 sm:bg-card/80 rounded-xl sm:border sm:p-4 sm:shadow-xl sm:backdrop-blur-sm">
          {sectionContent[activeSection]}
        </div>
      </div>
    </div>
  );
};

export { SettingsPage };
