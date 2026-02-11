'use client';

import * as React from 'react';

import { format, isValid, parse } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

/**
 * Parses a datetime-local string into a Date, or returns undefined.
 */
function parseDateTime(value: string | null): Date | undefined {
  if (!value) {return undefined;}

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

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const timeStr = e.target.value; // HH:mm

    if (!timeStr) {return;}

    const parts = timeStr.split(':').map(Number);
    const hours = parts[0] ?? 0;
    const minutes = parts[1] ?? 0;
    const base = selectedDate ?? new Date();
    const merged = new Date(base);
    merged.setHours(hours, minutes, 0, 0);
    onChange(formatDateTime(merged));
  }

  const timeValue = selectedDate ? format(selectedDate, 'HH:mm') : '';

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
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          {...(selectedDate ? { defaultMonth: selectedDate } : {})}
        />
        <div className="border-t p-3">
          <Input
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            size="sm"
            className="w-full"
            aria-label="Time"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { DateTimePicker };
