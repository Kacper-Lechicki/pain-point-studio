'use client';

import { useState } from 'react';

import { Home, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { ROUTES } from '@/config';
import { signOut } from '@/features/auth/actions';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Link, useRouter } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';
import { proxyImageUrl } from '@/lib/common/utils';

const UserMenu = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (loading) {
    return (
      <div className="flex size-8 items-center justify-center">
        <Spinner className="size-4" />
      </div>
    );
  }

  if (!user) {
    return (
      <Button asChild>
        <Link href={ROUTES.auth.signIn}>
          {t('common.signIn')}
          <UserIcon className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    );
  }

  const avatarUrl = (user.userMetadata?.avatar_url as string) || undefined;
  const fullName = (user.userMetadata?.full_name as string) || undefined;
  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : (user.email?.slice(0, 2).toUpperCase() ?? '??');

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      const result = await signOut();

      if (result.error) {
        toast.error(t(result.error as MessageKey));
        setIsSigningOut(false);
      } else {
        toast.success(t('auth.signOutSuccess'));
        router.push(ROUTES.common.home);
        router.refresh();
      }
    } catch {
      toast.error(t('auth.errors.unexpected'));
      setIsSigningOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="ring-ring/30 flex items-center rounded-full transition-all md:hover:ring-2"
          aria-label={t('common.aria.userMenu')}
        >
          <Avatar className="size-8 text-xs font-semibold">
            <AvatarImage src={proxyImageUrl(avatarUrl)} alt="" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{user.email}</p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={ROUTES.common.dashboard}>
              <Home className="size-4" aria-hidden="true" />
              {t('common.dashboard')}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href={ROUTES.profile.preview}>
              <UserIcon className="size-4" aria-hidden="true" />
              {t('common.profile')}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href={ROUTES.settings.profile}>
              <Settings className="size-4" aria-hidden="true" />
              {t('common.settings')}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut} data-testid="sign-out">
          {isSigningOut ? (
            <Spinner className="size-4" />
          ) : (
            <LogOut className="size-4" aria-hidden="true" />
          )}
          {t('auth.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { UserMenu };
