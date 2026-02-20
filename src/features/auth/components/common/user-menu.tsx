'use client';

import { useEffect, useRef, useState } from 'react';

import { Home, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ROUTES } from '@/config';
import { signOut } from '@/features/auth/actions';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Link, useRouter } from '@/i18n/routing';
import { cn, proxyImageUrl } from '@/lib/common/utils';

const UserMenu = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const initials = user.email?.slice(0, 2).toUpperCase() ?? '??';

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      const result = await signOut();

      if (result.error) {
        toast.error(result.error);
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
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="ring-ring/30 flex items-center rounded-full transition-all md:hover:ring-2"
        aria-label="User menu"
      >
        <Avatar className="size-8 text-xs font-semibold">
          <AvatarImage src={proxyImageUrl(avatarUrl)} alt="" />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </button>

      <div
        className={cn(
          'bg-popover text-popover-foreground absolute right-0 mt-2 w-56 origin-top-right rounded-xl border shadow-lg transition-all duration-200',
          isOpen
            ? 'pointer-events-auto scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0'
        )}
      >
        <div className="border-b px-4 py-3">
          <p className="truncate text-sm font-medium">{user.email}</p>
        </div>

        <div className="p-1">
          <Link
            href={ROUTES.common.dashboard}
            onClick={() => setIsOpen(false)}
            className="md:hover:text-foreground md:hover:border-muted-foreground/30 flex min-h-10 w-full items-center gap-2.5 rounded-lg border border-transparent px-3 text-sm font-medium transition-colors md:min-h-9 md:hover:border-dashed"
          >
            <Home className="size-4 shrink-0" aria-hidden="true" />
            {t('common.dashboard')}
          </Link>

          <Link
            href={ROUTES.profile.preview}
            onClick={() => setIsOpen(false)}
            className="md:hover:text-foreground md:hover:border-muted-foreground/30 flex min-h-10 w-full items-center gap-2.5 rounded-lg border border-transparent px-3 text-sm font-medium transition-colors md:min-h-9 md:hover:border-dashed"
          >
            <UserIcon className="size-4 shrink-0" aria-hidden="true" />
            {t('common.profile')}
          </Link>

          <Link
            href={ROUTES.settings.profile}
            onClick={() => setIsOpen(false)}
            className="md:hover:text-foreground md:hover:border-muted-foreground/30 flex min-h-10 w-full items-center gap-2.5 rounded-lg border border-transparent px-3 text-sm font-medium transition-colors md:min-h-9 md:hover:border-dashed"
          >
            <Settings className="size-4 shrink-0" aria-hidden="true" />
            {t('common.settings')}
          </Link>
        </div>

        <div className="border-t p-1">
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            data-testid="sign-out"
            className="md:hover:text-foreground md:hover:border-muted-foreground/30 flex min-h-10 w-full items-center gap-2.5 rounded-lg border border-transparent px-3 text-sm font-medium transition-colors disabled:opacity-50 md:min-h-9 md:hover:border-dashed"
          >
            {isSigningOut ? (
              <Spinner className="size-4" />
            ) : (
              <LogOut className="size-4" aria-hidden="true" />
            )}
            {t('auth.signOut')}
          </button>
        </div>
      </div>
    </div>
  );
};

export { UserMenu };
