'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';

import { LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ROUTES } from '@/config';
import { signOut } from '@/features/auth/actions';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useRouter } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/common/utils';

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
      <div className="flex size-9 items-center justify-center">
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

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
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
        router.push('/');
        router.refresh();
      }
    } catch {
      toast.error(t('auth.unexpectedError'));
      setIsSigningOut(false);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="bg-primary text-primary-foreground flex size-9 items-center justify-center overflow-hidden rounded-full text-xs font-semibold transition-opacity hover:opacity-90"
        aria-label="User menu"
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" width={36} height={36} className="size-full object-cover" />
        ) : (
          initials
        )}
      </button>

      <div
        className={cn(
          'bg-popover text-popover-foreground absolute right-0 mt-2 w-56 origin-top-right rounded-md border shadow-lg transition-all duration-200',
          isOpen
            ? 'pointer-events-auto scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0'
        )}
      >
        <div className="border-b px-4 py-3">
          <p className="truncate text-sm font-medium">{user.email}</p>
        </div>

        <div className="py-1">
          <Link
            href={ROUTES.common.settings}
            onClick={() => setIsOpen(false)}
            className="hover:bg-accent flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors"
          >
            <Settings className="size-4" aria-hidden="true" />
            {t('common.settings')}
          </Link>

          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="hover:bg-accent flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors disabled:opacity-50"
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
