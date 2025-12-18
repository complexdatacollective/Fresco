'use client';

import { Check, X } from 'lucide-react';
import { type HTMLAttributes } from 'react';
import Button from '~/components/ui/Button';
import {
  booleanButtonVariants,
  booleanIndicatorVariants,
  controlLabelVariants,
} from '~/styles/shared/controlVariants';
import { cx } from '~/utils/cva';

type BooleanFieldProps = Omit<
  HTMLAttributes<HTMLFieldSetElement>,
  'onChange'
> & {
  value?: boolean | null;
  onChange?: (value: boolean | null) => void;
  disabled?: boolean;
  noReset?: boolean;
  label?: string;
  options?: {
    label: string;
    value: boolean;
  }[];
};

export function BooleanField({
  className,
  value,
  onChange,
  disabled = false,
  noReset = false,
  label,
  options = [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ],
  ...divProps
}: BooleanFieldProps) {
  return (
    <fieldset
      className={cx('w-full space-y-2 border-0 p-0', className)}
      {...divProps}
    >
      {label && <legend className="sr-only">{label}</legend>}
      <div className="flex gap-2">
        {options.map((option) => {
          const isSelected = value === option.value;
          const isPositive = option.value === true;

          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange?.(option.value)}
              disabled={disabled}
              className={booleanButtonVariants({
                selected: isSelected,
                positive: isPositive,
              })}
            >
              <div
                className={booleanIndicatorVariants({
                  selected: isSelected,
                  positive: isPositive,
                })}
              >
                {isSelected &&
                  (isPositive ? <Check size={16} /> : <X size={16} />)}
              </div>
              <span className={controlLabelVariants({ size: 'md' })}>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
      {!noReset && (
        <Button
          variant="text"
          onClick={() => onChange?.(null)}
          disabled={disabled}
          size="xs"
        >
          Reset answer
        </Button>
      )}
    </fieldset>
  );
}
