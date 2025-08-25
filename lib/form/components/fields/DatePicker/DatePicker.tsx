'use client';

import React, { forwardRef } from 'react';
import { DatePickerProvider, type DateType } from './DatePickerContext';
import { DatePreview } from './DatePreview';
import { type DateRange } from './helpers';

export type DatePickerProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size' | 'onChange' | 'value'
> & {
  value?: string | null;
  onChange?: (value: string | null) => void;
  type?: DateType;
  range?: DateRange;
  minDate?: string;
  maxDate?: string;
};

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      type = 'full',
      range,
      minDate,
      maxDate,
      placeholder,
      disabled,
      className,
      id,
      name,
      required,
      autoFocus,
      ...props
    },
    ref,
  ) => {
    // Hidden input for form submission
    const hiddenInputRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => hiddenInputRef.current!);

    const minDateObj = minDate ? new Date(minDate) : undefined;
    const maxDateObj = maxDate ? new Date(maxDate) : undefined;

    return (
      <DatePickerProvider
        value={value}
        onChange={(newValue) => {
          onChange?.(newValue);
          // Update hidden input
          if (hiddenInputRef.current) {
            hiddenInputRef.current.value = newValue ?? '';
            // Dispatch change event for form libraries
            const event = new Event('change', { bubbles: true });
            hiddenInputRef.current.dispatchEvent(event);
          }
        }}
        type={type}
        range={range}
        minDate={minDateObj}
        maxDate={maxDateObj}
      >
        <DatePreview
          placeholder={placeholder}
          disabled={disabled}
          className={className}
          id={id}
          autoFocus={autoFocus}
        />
        <input
          ref={hiddenInputRef}
          type="hidden"
          name={name}
          value={value ?? ''}
          required={required}
          {...props}
        />
      </DatePickerProvider>
    );
  },
);

DatePicker.displayName = 'DatePicker';
