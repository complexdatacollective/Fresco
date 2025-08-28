'use client';

import { type InputHTMLAttributes } from 'react';
import { InputField } from './Input';

type DatePickerFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>;

export function DatePickerField({
  type: resolutionType,
  min,
  max,
  ...props
}: DatePickerFieldProps) {
  let step;
  if (resolutionType === 'month') {
    step = '31';
  } else if (resolutionType === 'year') {
    step = '365';
  }

  return <InputField type="date" min={min} max={max} step={step} {...props} />;
}
