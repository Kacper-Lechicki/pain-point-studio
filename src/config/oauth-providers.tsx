import { ComponentType, SVGProps } from 'react';

import { Github } from 'lucide-react';

import { GoogleIcon } from '@/components/shared/icons/google-icon';
import { AuthProvider } from '@/features/auth/types';
import type { MessageKey } from '@/i18n/types';

export interface OAuthProviderConfig {
  id: AuthProvider;
  icon: ComponentType<{ className?: string } | SVGProps<SVGSVGElement>>;
  label: MessageKey;
}

export const OAUTH_PROVIDERS: OAuthProviderConfig[] = [
  {
    id: 'github',
    icon: Github,
    label: 'auth.providers.github',
  },
  {
    id: 'google',
    icon: GoogleIcon,
    label: 'auth.providers.google',
  },
];
