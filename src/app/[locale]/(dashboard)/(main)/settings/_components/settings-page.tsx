'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { motion } from 'motion/react';

import { SettingsHeader } from '@/app/[locale]/(dashboard)/(main)/settings/_components/settings-header';
import {
  SettingsNavButtons,
  SettingsNavSelect,
} from '@/app/[locale]/(dashboard)/(main)/settings/_components/settings-nav';
import { BackButton } from '@/components/ui/back-button';
import { HASH_TO_SECTION, SECTION_TO_HASH, type SettingsSectionValue } from '@/config/routes';
import { ProfileData } from '@/features/settings/actions';
import { AppearanceSection } from '@/features/settings/components/appearance-section';
import { ConnectedAccounts } from '@/features/settings/components/connected-accounts';
import { DangerZone } from '@/features/settings/components/danger-zone';
import { EmailForm } from '@/features/settings/components/email-form';
import { PasswordForm } from '@/features/settings/components/password-form';
import { ProfileForm } from '@/features/settings/components/profile-form';

const DEFAULT_SECTION: SettingsSectionValue = 'profile';

function getSectionFromHash(): SettingsSectionValue {
  if (typeof window === 'undefined') {
    return DEFAULT_SECTION;
  }

  const hash = window.location.hash.replace('#', '');

  return HASH_TO_SECTION[hash] ?? DEFAULT_SECTION;
}

interface SettingsPageProps {
  profile: ProfileData;
}

const SettingsPage = ({ profile }: SettingsPageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeSection, setActiveSectionState] = useState<SettingsSectionValue>(DEFAULT_SECTION);

  useEffect(() => {
    containerRef.current?.classList.remove('invisible');

    const section = getSectionFromHash();

    window.history.replaceState(null, '', `#${SECTION_TO_HASH[section]}`);
    queueMicrotask(() => setActiveSectionState(section));
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

  const renderSection = (section: SettingsSectionValue) => {
    switch (section) {
      case 'profile':
        return <ProfileForm profile={profile} />;
      case 'email':
        return (
          <EmailForm
            currentEmail={profile.email}
            pendingEmail={profile.pendingEmail}
            emailChangeConfirmStatus={profile.emailChangeConfirmStatus}
          />
        );
      case 'password':
        return <PasswordForm hasPassword={profile.hasPassword} />;
      case 'appearance':
        return <AppearanceSection />;
      case 'connectedAccounts':
        return (
          <ConnectedAccounts identities={profile.identities} hasPassword={profile.hasPassword} />
        );
      case 'dangerZone':
        return <DangerZone userEmail={profile.email} />;
    }
  };

  return (
    <div ref={containerRef} className="invisible mx-auto w-full">
      <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
        <div className="sticky top-24 hidden w-(--sidebar-sub-panel-width) shrink-0 flex-col gap-6 lg:flex">
          <BackButton />
          <SettingsHeader />
          <SettingsNavButtons activeSection={activeSection} onSectionChange={setActiveSection} />
        </div>

        <div className="w-full space-y-6 lg:hidden">
          <SettingsHeader />
          <SettingsNavSelect activeSection={activeSection} onSectionChange={setActiveSection} />
          <div className="border-border/50 border-b" />
        </div>

        <div className="sm:border-border/50 sm:bg-card min-w-0 flex-1 rounded-xl sm:border sm:p-6 sm:shadow-xl lg:p-10">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {renderSection(activeSection)}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export { SettingsPage };
