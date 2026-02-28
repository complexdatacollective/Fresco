'use client';

import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { type ComponentPropsWithoutRef, forwardRef, useState } from 'react';
import {
  controlVariants,
  inputControlVariants,
  smallSizeVariants,
  stateVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, type VariantProps } from '~/utils/cva';
import { getInputState } from '../../utils/getInputState';

const checkboxRootVariants = compose(
  smallSizeVariants,
  controlVariants,
  inputControlVariants,
  stateVariants,
  cva({
    base: 'focusable flex aspect-square items-center justify-center rounded-full',
  }),
);

const checkboxIndicatorVariants = compose(
  cva({
    base: '',
  }),
);

/**
 * Checkbox is a UI primitive component, not a form field.
 * It uses the native checked/onCheckedChange API from @base-ui/react/checkbox.
 * For form usage, wrap with the Field component.
 */
type CheckboxProps = Omit<
  ComponentPropsWithoutRef<typeof BaseCheckbox.Root>,
  'size'
> &
  VariantProps<typeof checkboxRootVariants> & {
    disabled?: boolean;
    readOnly?: boolean;
  };

const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    {
      className,
      size = 'md',
      onCheckedChange,
      checked,
      defaultChecked = false,
      disabled,
      readOnly,
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const isControlled = checked !== undefined;
    const [internalChecked, setInternalChecked] = useState(defaultChecked);
    const isChecked = isControlled ? checked : internalChecked;

    const handleCheckedChange: NonNullable<
      ComponentPropsWithoutRef<typeof BaseCheckbox.Root>['onCheckedChange']
    > = (newChecked, eventDetails) => {
      if (readOnly) return;
      if (!isControlled) {
        setInternalChecked(newChecked);
      }
      onCheckedChange?.(newChecked, eventDetails);
    };

    return (
      <BaseCheckbox.Root
        ref={ref}
        onCheckedChange={handleCheckedChange}
        disabled={disabled ?? readOnly}
        {...(isControlled ? { checked } : { defaultChecked })}
        {...props}
        className={checkboxRootVariants({
          size,
          className,
          state: getInputState({
            disabled,
            readOnly,
            'aria-invalid': !!ariaInvalid,
          }),
        })}
        nativeButton
        render={<button />}
      >
        <BaseCheckbox.Indicator
          className={checkboxIndicatorVariants()}
          render={<span />}
          keepMounted
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="text-primary size-full p-[0.1em]"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path
              d="M4 12L10 18L20 6"
              pathLength={1}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: isChecked ? 0 : 1,
                strokeLinecap: isChecked ? 'round' : 'butt',
                transition: 'stroke-dashoffset 0.2s ease-out',
              }}
            />
          </svg>
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
    );
  },
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
