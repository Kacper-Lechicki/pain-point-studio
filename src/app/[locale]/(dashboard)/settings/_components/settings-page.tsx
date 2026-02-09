'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { CircleUserRound, KeyRound, Link2, Mail, Palette, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { SettingsHeader } from '@/app/[locale]/(dashboard)/settings/_components/settings-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HASH_TO_SECTION, SECTION_TO_HASH, type SettingsSectionValue } from '@/config/routes';
import { ProfileData } from '@/features/settings/actions';
import { AppearanceSection } from '@/features/settings/components/appearance-section';
import { ConnectedAccounts } from '@/features/settings/components/connected-accounts';
import { DangerZone } from '@/features/settings/components/danger-zone';
import { EmailForm } from '@/features/settings/components/email-form';
import { PasswordForm } from '@/features/settings/components/password-form';
import { ProfileForm } from '@/features/settings/components/profile-form';

const SECTIONS = [
  { value: 'profile', icon: CircleUserRound },
  { value: 'email', icon: Mail },
  { value: 'password', icon: KeyRound },
  { value: 'appearance', icon: Palette },
  { value: 'connectedAccounts', icon: Link2 },
  { value: 'dangerZone', icon: Trash2 },
] as const;

const DEFAULT_SECTION: SettingsSectionValue = 'profile';

function getSectionFromHash(): SettingsSectionValue {
  const hash = window.location.hash.replace('#', '');

  return HASH_TO_SECTION[hash] ?? DEFAULT_SECTION;
}

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

  const [activeSection, setActiveSectionState] = useState<SettingsSectionValue>(() =>
    typeof window === 'undefined' ? DEFAULT_SECTION : getSectionFromHash()
  );

  useEffect(() => {
    const section = getSectionFromHash();
    window.history.replaceState(null, '', `#${SECTION_TO_HASH[section]}`);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setActiveSectionState(getSectionFromHash());
    };

    window.addEventListener('popstate', handlePopState);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setActiveSection = useCallback((section: SettingsSectionValue) => {
    if (section === getSectionFromHash()) {
      return;
    }

    setActiveSectionState(section);
    window.history.replaceState(null, '', `#${SECTION_TO_HASH[section]}`);
  }, []);

  const sectionContent: Record<SettingsSectionValue, React.ReactNode> = {
    profile: <ProfileForm profile={profile} />,
    email: <EmailForm currentEmail={profile.email} />,
    password: <PasswordForm hasPassword={profile.hasPassword} />,
    appearance: <AppearanceSection />,
    connectedAccounts: <ConnectedAccounts identities={profile.identities} />,
    dangerZone: <DangerZone userEmail={profile.email} />,
  };

  if (!mounted) {
    return (
      <div className="mx-auto w-full">
        <div className="space-y-6">
          <SettingsHeader />
          <div className="border-border/50 border-b lg:hidden" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full">
      <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div className="sticky top-24 hidden w-60 shrink-0 flex-col gap-6 lg:flex">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">{t('description')}</p>
          </div>

          <nav className="flex w-full flex-col gap-2" data-testid="settings-nav">
            {SECTIONS.map(({ value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                data-section={value}
                data-state={activeSection === value ? 'active' : 'inactive'}
                onClick={() => setActiveSection(value)}
                className="text-muted-foreground hover:text-foreground hover:bg-accent/50 data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:border-primary flex h-9 min-h-9 w-full items-center justify-start gap-2.5 rounded-lg border-l-2 border-transparent px-3 text-sm font-medium transition-all"
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {t(`nav.${value}`)}
              </button>
            ))}
          </nav>
        </div>

        <div className="w-full space-y-6 lg:hidden">
          <SettingsHeader />

          <Select
            value={activeSection}
            onValueChange={(v) => setActiveSection(v as SettingsSectionValue)}
          >
            <SelectTrigger
              className="w-full"
              data-testid="settings-nav-select"
              aria-label={t('nav.label')}
            >
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

          <div className="border-border/50 border-b" />
        </div>

        <div className="sm:border-border/50 sm:bg-card min-w-0 flex-1 rounded-xl sm:border sm:p-6 sm:shadow-xl lg:p-10">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {sectionContent[activeSection]}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export { SettingsPage };
