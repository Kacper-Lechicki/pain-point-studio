'use client';

import { Check, Circle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PASSWORD_CONFIG, calculatePasswordStrength } from '@/features/auth/config/password';
import { cn } from '@/lib/common/utils';

interface PasswordStrengthProps {
  password?: string;
  isError?: boolean;
}

interface Requirement {
  key: string;
  met: boolean;
}

const PasswordStrength = ({ password = '', isError = false }: PasswordStrengthProps) => {
  const t = useTranslations('auth');
  const strength = calculatePasswordStrength(password);

  const requirements = [
    { key: 'length', met: PASSWORD_CONFIG.REQUIREMENTS.LENGTH(password) },
    { key: 'upper', met: PASSWORD_CONFIG.REQUIREMENTS.UPPER(password) },
    { key: 'lower', met: PASSWORD_CONFIG.REQUIREMENTS.LOWER(password) },
    { key: 'number', met: PASSWORD_CONFIG.REQUIREMENTS.NUMBER(password) },
    { key: 'special', met: PASSWORD_CONFIG.REQUIREMENTS.SPECIAL(password) },
  ];

  const getLabel = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return t('strength.tooWeak');
      case 2:
        return t('strength.weak');
      case 3:
        return t('strength.medium');
      case 4:
        return t('strength.strong');
      case 5:
        return t('strength.veryStrong');
      default:
        return '';
    }
  };

  const getColorClass = (score: number) => {
    switch (score) {
      case 0:
        return 'bg-muted';
      case 1:
        return 'bg-destructive';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-green-500';
      case 5:
        return 'bg-emerald-600';
      default:
        return 'bg-muted';
    }
  };

  const label = getLabel(strength);
  const colorClass = getColorClass(strength);

  return (
    <div className="mt-1.5 space-y-2">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground/90">{t('passwordStrength')}</span>
        <span
          className={cn(
            'font-semibold',
            strength > 0 ? 'text-foreground' : 'text-muted-foreground/50'
          )}
        >
          {label}
        </span>
      </div>

      <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
        <div
          className={cn('h-full transition-all duration-300 ease-in-out', colorClass)}
          style={{ width: `${(strength / 5) * 100}%` }}
        />
      </div>

      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2" aria-label={t('passwordRequirements')}>
        {requirements.map((req: Requirement) => (
          <li key={req.key} className="flex items-center gap-1.5 text-[10px]">
            {req.met ? (
              <Check className="text-success size-2.5" aria-hidden="true" />
            ) : !password && !isError ? (
              <Circle className="text-muted-foreground/40 size-2.5" aria-hidden="true" />
            ) : (
              <X className="text-destructive size-2.5" aria-hidden="true" />
            )}

            <span
              className={cn(
                req.met ? 'text-foreground/80' : 'text-muted-foreground/60',
                !req.met && (password || isError) && 'text-destructive/80'
              )}
            >
              {t(`requirements.${req.key}`)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export { PasswordStrength };
