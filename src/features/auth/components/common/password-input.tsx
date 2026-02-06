'use client';

import * as React from 'react';

import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/common/utils';

type PasswordInputProps = React.ComponentProps<typeof Input>;

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const t = useTranslations('auth');
    const [showPassword, setShowPassword] = React.useState(false);

    const togglePassword = () => setShowPassword((prev) => !prev);

    return (
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          className={cn('pr-10', className)}
          ref={ref}
          {...props}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground absolute top-0 right-0 h-full px-3 hover:bg-transparent"
          onClick={togglePassword}
          aria-label={showPassword ? t('hidePassword') : t('showPassword')}
        >
          {showPassword ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
