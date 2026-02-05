import { ComponentType, SVGProps } from 'react';

import { Github } from 'lucide-react';

import { GoogleIcon } from '@/features/auth/components/google-icon';
import { AuthProvider } from '@/features/auth/types';

export interface OAuthProviderConfig {
  id: AuthProvider;
  icon: ComponentType<{ className?: string } | SVGProps<SVGSVGElement>>;
  label: string;
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
