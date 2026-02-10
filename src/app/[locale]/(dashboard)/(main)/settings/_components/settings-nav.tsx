'use client';

import { CircleUserRound, KeyRound, Link2, Mail, Palette, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SettingsSectionValue } from '@/config/routes';

const SECTIONS = [
  { value: 'profile', icon: CircleUserRound },
  { value: 'email', icon: Mail },
  { value: 'password', icon: KeyRound },
  { value: 'appearance', icon: Palette },
  { value: 'connectedAccounts', icon: Link2 },
  { value: 'dangerZone', icon: Trash2 },
] as const;

interface SettingsNavProps {
  activeSection: SettingsSectionValue;
  onSectionChange: (section: SettingsSectionValue) => void;
}

const SettingsNavButtons = ({ activeSection, onSectionChange }: SettingsNavProps) => {
  const t = useTranslations('settings.nav');

  return (
    <nav className="flex w-full flex-col gap-2" data-testid="settings-nav">
      {SECTIONS.map(({ value, icon: Icon }) => (
        <button
          key={value}
          type="button"
          data-section={value}
          data-state={activeSection === value ? 'active' : 'inactive'}
          onClick={() => onSectionChange(value)}
          className="text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:border-primary data-[state=inactive]:md:hover:text-foreground data-[state=inactive]:md:hover:border-muted-foreground/30 flex h-10 min-h-10 w-full items-center justify-start gap-2.5 rounded-lg border border-transparent px-3 text-sm font-medium transition-colors data-[state=active]:border-solid md:h-9 md:min-h-9 data-[state=inactive]:md:hover:border-dashed"
        >
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          {t(value)}
        </button>
      ))}
    </nav>
  );
};

const SettingsNavSelect = ({ activeSection, onSectionChange }: SettingsNavProps) => {
  const t = useTranslations('settings.nav');

  return (
    <Select
      name="settings-section"
      value={activeSection}
      onValueChange={(v) => onSectionChange(v as SettingsSectionValue)}
    >
      <SelectTrigger className="w-full" data-testid="settings-nav-select" aria-label={t('label')}>
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {SECTIONS.map(({ value, icon: Icon }) => (
          <SelectItem key={value} value={value} data-section={value}>
            <Icon className="size-4" />
            {t(value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export { SettingsNavButtons, SettingsNavSelect };
