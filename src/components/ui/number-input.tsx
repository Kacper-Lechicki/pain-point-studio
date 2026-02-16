'use client';

import * as React from 'react';

import { Minus, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/common/utils';

interface NumberInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  name?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    { value, onChange, onBlur, name, min, max, step = 1, placeholder, disabled, className },
    ref
  ) => {
    const canDecrement = value !== null && (min === undefined || value - step >= min);
    const canIncrement = value === null || max === undefined || value + step <= max;

    function handleDecrement() {
      if (value === null) {
        return;
      }

      const next = value - step;

      if (min !== undefined && next < min) {
        return;
      }

      onChange(next);
    }

    function handleIncrement() {
      if (value === null) {
        onChange(min ?? step);

        return;
      }

      const next = value + step;

      if (max !== undefined && next > max) {
        return;
      }

      onChange(next);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value;

      if (raw === '') {
        onChange(null);

        return;
      }

      const num = Number(raw);

      if (Number.isNaN(num) || !Number.isInteger(num)) {
        return;
      }

      onChange(num);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (['e', 'E', '.', ',', '+', '-'].includes(e.key)) {
        e.preventDefault();
      }
    }

    function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
      const pasted = e.clipboardData.getData('text');

      if (!/^\d+$/.test(pasted)) {
        e.preventDefault();

        const digitsOnly = pasted.replace(/\D/g, '');

        if (digitsOnly) {
          onChange(Number(digitsOnly));
        }
      }
    }

    function handleBlur() {
      if (value !== null) {
        let clamped = value;

        if (min !== undefined && clamped < min) {
          clamped = min;
        }

        if (max !== undefined && clamped > max) {
          clamped = max;
        }

        if (clamped !== value) {
          onChange(clamped);
        }
      }

      onBlur?.();
    }

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || !canDecrement}
          onClick={handleDecrement}
          tabIndex={-1}
          aria-label="Decrease"
        >
          <Minus className="size-4" />
        </Button>

        <Input
          ref={ref}
          type="number"
          inputMode="numeric"
          value={value ?? ''}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          name={name}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          disabled={disabled}
          className="[appearance:textfield] text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || !canIncrement}
          onClick={handleIncrement}
          tabIndex={-1}
          aria-label="Increase"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';

export { NumberInput };
