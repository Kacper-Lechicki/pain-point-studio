'use client';

import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/common/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'default' | 'sm';
}

const SIZES = {
  default: { icon: 'size-4', pad: 'pl-9', clearPad: 'pr-9', clearPos: 'right-3' },
  sm: { icon: 'size-3.5', pad: 'pl-8', clearPad: 'pr-7', clearPos: 'right-2' },
} as const;

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  size = 'default',
}: SearchInputProps) {
  const t = useTranslations();
  const s = SIZES[size];
  const hasValue = value.length > 0;

  return (
    <div className={cn('relative min-w-0', className)}>
      <Search
        className={cn(
          'text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2',
          size === 'sm' && 'left-2.5',
          s.icon
        )}
      />

      <Input
        size={size}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(s.pad, hasValue && s.clearPad, size === 'sm' && 'text-xs')}
      />

      {hasValue && (
        <button
          type="button"
          onClick={() => onChange('')}
          className={cn(
            'text-muted-foreground hover:text-foreground absolute top-1/2 -translate-y-1/2 transition-colors',
            s.clearPos
          )}
          aria-label={t('common.aria.clearSearch')}
        >
          <X className={s.icon} />
        </button>
      )}
    </div>
  );
}
