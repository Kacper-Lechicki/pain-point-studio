'use client';

import * as React from 'react';

import { format, isSameDay, isValid, startOfDay } from 'date-fns';
import { CalendarIcon, ClockIcon } from 'lucide-react';
import type { Matcher } from 'react-day-picker';

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
  value: string | null;
  onChange: (value: string | null) => void;
  onBlur?: () => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  disabledBefore?: Date | undefined;
  disabledAfter?: Date | undefined;
  className?: string;
}

const ALL_HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const ALL_MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

function parseDateTime(value: string | null): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  return isValid(date) ? date : undefined;
}

function formatDateTime(date: Date): string {
  return date.toISOString();
}

function clampDateTime(candidate: Date, min: Date | undefined, max: Date | undefined): Date {
  let result = candidate;

  if (min && result < min) {
    result = new Date(min);
  }

  if (max && result > max) {
    result = new Date(max);
  }

  return result;
}

function DateTimePicker({
  value,
  onChange,
  onBlur,
  name,
  placeholder = 'Pick a date & time',
  disabled,
  disabledBefore,
  disabledAfter,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = parseDateTime(value);

  function emitClamped(candidate: Date) {
    const clamped = clampDateTime(candidate, disabledBefore, disabledAfter);

    onChange(formatDateTime(clamped));
  }

  function handleDateSelect(day: Date | undefined) {
    if (!day) {
      onChange(null);

      return;
    }

    const hours = selectedDate ? selectedDate.getHours() : 0;
    const minutes = selectedDate ? selectedDate.getMinutes() : 0;
    const merged = new Date(day);

    merged.setHours(hours, minutes, 0, 0);
    emitClamped(merged);
  }

  function handleHourChange(hour: string) {
    const base = selectedDate ?? new Date();
    const merged = new Date(base);

    merged.setHours(Number(hour), merged.getMinutes(), 0, 0);
    emitClamped(merged);
  }

  function handleMinuteChange(minute: string) {
    const base = selectedDate ?? new Date();
    const merged = new Date(base);

    merged.setHours(merged.getHours(), Number(minute), 0, 0);
    emitClamped(merged);
  }

  const currentHour = selectedDate ? String(selectedDate.getHours()).padStart(2, '0') : undefined;

  const currentMinute = selectedDate
    ? String(selectedDate.getMinutes()).padStart(2, '0')
    : undefined;

  const { allowedHours, allowedMinutes } = React.useMemo(() => {
    let minHour = 0;
    let maxHour = 23;
    let minMinuteForCurrentHour = 0;
    let maxMinuteForCurrentHour = 55;

    const selHour = selectedDate ? selectedDate.getHours() : 0;

    if (disabledBefore && selectedDate && isSameDay(selectedDate, disabledBefore)) {
      minHour = disabledBefore.getHours();

      if (selHour === minHour) {
        minMinuteForCurrentHour = disabledBefore.getMinutes();
      }
    }

    if (disabledAfter && selectedDate && isSameDay(selectedDate, disabledAfter)) {
      maxHour = disabledAfter.getHours();

      if (selHour === maxHour) {
        maxMinuteForCurrentHour = disabledAfter.getMinutes();
      }
    }

    const hours = ALL_HOURS.filter((h) => {
      const n = Number(h);

      return n >= minHour && n <= maxHour;
    });

    const minutes = ALL_MINUTES.filter((m) => {
      const n = Number(m);

      return n >= minMinuteForCurrentHour && n <= maxMinuteForCurrentHour;
    });

    return { allowedHours: hours, allowedMinutes: minutes };
  }, [selectedDate, disabledBefore, disabledAfter]);

  const calendarDisabled = React.useMemo(() => {
    const matchers: Matcher[] = [];

    if (disabledBefore) {
      matchers.push({ before: startOfDay(disabledBefore) });
    }

    if (disabledAfter) {
      matchers.push({ after: disabledAfter });
    }

    return matchers;
  }, [disabledBefore, disabledAfter]);

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
          {...(calendarDisabled.length > 0 ? { disabled: calendarDisabled } : {})}
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
                {allowedHours.map((h) => (
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
                {allowedMinutes.map((m) => (
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
