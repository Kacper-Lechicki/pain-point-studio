'use client';

import * as React from 'react';

import { format, isValid, parse } from 'date-fns';
import { CalendarIcon, ClockIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/common/utils';

interface DateTimePickerProps {
  /** ISO datetime-local string (YYYY-MM-DDTHH:mm) or null */
  value: string | null;
  onChange: (value: string | null) => void;
  onBlur?: () => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

/**
 * Parses a datetime-local string into a Date, or returns undefined.
 */
function parseDateTime(value: string | null): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = parse(value, "yyyy-MM-dd'T'HH:mm", new Date());

  return isValid(date) ? date : undefined;
}

/**
 * Formats a Date to a datetime-local string (YYYY-MM-DDTHH:mm).
 */
function formatDateTime(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

function DateTimePicker({
  value,
  onChange,
  onBlur,
  name,
  placeholder = 'Pick a date & time',
  disabled,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = parseDateTime(value);

  function handleDateSelect(day: Date | undefined) {
    if (!day) {
      onChange(null);

      return;
    }

    // Preserve existing time, or default to 00:00
    const hours = selectedDate ? selectedDate.getHours() : 0;
    const minutes = selectedDate ? selectedDate.getMinutes() : 0;

    const merged = new Date(day);
    merged.setHours(hours, minutes, 0, 0);
    onChange(formatDateTime(merged));
  }

  function handleHourChange(hour: string) {
    const base = selectedDate ?? new Date();
    const merged = new Date(base);
    merged.setHours(Number(hour), merged.getMinutes(), 0, 0);
    onChange(formatDateTime(merged));
  }

  function handleMinuteChange(minute: string) {
    const base = selectedDate ?? new Date();
    const merged = new Date(base);
    merged.setHours(merged.getHours(), Number(minute), 0, 0);
    onChange(formatDateTime(merged));
  }

  const currentHour = selectedDate ? String(selectedDate.getHours()).padStart(2, '0') : undefined;
  const currentMinute = selectedDate
    ? String(selectedDate.getMinutes()).padStart(2, '0')
    : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-10 w-full justify-start text-left font-normal md:h-9',
            !value && 'text-muted-foreground',
            className
          )}
          name={name}
          onBlur={onBlur}
        >
          <CalendarIcon className="text-muted-foreground size-4" />
          {selectedDate ? (
            <span>{format(selectedDate, 'MMM d, yyyy  HH:mm')}</span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        side="bottom"
        sticky="always"
        collisionPadding={8}
      >
        <Calendar
          mode="single"
          fixedWeeks
          className="p-2 [--cell-size:--spacing(7)] [&_.rdp-month]:gap-2 [&_.rdp-nav]:h-(--cell-size) [&_.rdp-week]:mt-0.5"
          selected={selectedDate}
          onSelect={handleDateSelect}
          {...(selectedDate ? { defaultMonth: selectedDate } : {})}
        />
        <div className="border-t px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <ClockIcon className="text-muted-foreground size-3.5 shrink-0" />
            <Select
              {...(currentHour ? { value: currentHour } : {})}
              onValueChange={handleHourChange}
            >
              <SelectTrigger size="sm" className="h-7 w-full text-xs" aria-label="Hour">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-48">
                {HOURS.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground text-xs font-medium">:</span>
            <Select
              {...(currentMinute ? { value: currentMinute } : {})}
              onValueChange={handleMinuteChange}
            >
              <SelectTrigger size="sm" className="h-7 w-full text-xs" aria-label="Minute">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-48">
                {MINUTES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { DateTimePicker };
