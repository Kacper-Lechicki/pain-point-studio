'use client';

import * as React from 'react';

import { CheckIcon, ChevronDownIcon, Search } from 'lucide-react';

import { FORM_CONTROL_SIZES } from '@/components/ui/form-variants';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/common/utils';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
  'data-testid'?: string;
}

function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  className,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  'data-testid': dataTestId,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listboxId = React.useId();
  const selectedLabel = options.find((o) => o.value === value)?.label;

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  function select(optionValue: string) {
    onValueChange(optionValue);
    setOpen(false);
    setSearch('');
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);

        if (!next) {
          setSearch('');
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid}
          data-testid={dataTestId}
          className={cn(
            "border-input data-placeholder:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
            FORM_CONTROL_SIZES.default,
            className
          )}
        >
          <span className={cn('truncate', !selectedLabel && 'text-muted-foreground')}>
            {selectedLabel ?? placeholder}
          </span>

          <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <div className="border-b px-2">
          <div className="flex items-center gap-2">
            <Search className="text-muted-foreground size-4 shrink-0" />

            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="placeholder:text-muted-foreground flex h-9 w-full bg-transparent py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setOpen(false);
                  setSearch('');
                }
              }}
            />
          </div>
        </div>

        <div id={listboxId} role="listbox" className="max-h-[200px] overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">{emptyMessage}</p>
          ) : (
            filtered.map((option) => {
              const isSelected = value === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => select(option.value)}
                  className="focus-visible:border-foreground/30 focus-visible:text-foreground hover:border-foreground/30 hover:text-foreground relative flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-transparent py-1.5 pr-8 pl-2 text-sm outline-hidden transition-colors select-none hover:border-dashed focus-visible:border-dashed md:min-h-9"
                >
                  {option.label}
                  {isSelected && (
                    <span className="absolute right-2 flex size-3.5 items-center justify-center">
                      <CheckIcon className="size-4" />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { Combobox };
