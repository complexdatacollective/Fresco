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
    base: 'focusable flex aspect-square shrink-0 items-center justify-center rounded-[0.15em]',
  }),
);

const checkboxIndicatorVariants = cva({
  base: 'text-primary flex p-[0.1em]',
  variants: {
    size: {
      sm: 'size-4',
      md: 'size-5',
      lg: 'size-6',
      xl: 'size-7',
    },
  },
});

type CheckboxProps = Omit<
  ComponentPropsWithoutRef<typeof BaseCheckbox.Root>,
  'size' | 'value' | 'onChange'
> &
  VariantProps<typeof checkboxRootVariants> & {
    value?: boolean;
    onChange?: (value: boolean | undefined) => void;
    disabled?: boolean;
    readOnly?: boolean;
  };

const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    {
      className,
      size = 'md',
      value,
      onChange,
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
    // Support both form system (value/onChange) and base-ui (checked/onCheckedChange) APIs.
    // Form system props take precedence when provided.
    const resolvedChecked = onChange !== undefined ? value : checked;
    const resolvedOnCheckedChange: typeof onCheckedChange =
      onChange !== undefined
        ? (newChecked) => onChange(newChecked)
        : onCheckedChange;

    // Determine if controlled or uncontrolled mode
    const isControlled = resolvedOnCheckedChange !== undefined;
    // For controlled mode, use false as fallback to prevent uncontrolled->controlled switch
    const controlledChecked = isControlled
      ? (resolvedChecked ?? false)
      : undefined;

    const [internalChecked, setInternalChecked] = useState(defaultChecked);
    const isChecked = isControlled ? controlledChecked : internalChecked;

    const handleCheckedChange: NonNullable<
      ComponentPropsWithoutRef<typeof BaseCheckbox.Root>['onCheckedChange']
    > = (newChecked, eventDetails) => {
      if (readOnly) return;
      if (!isControlled) {
        setInternalChecked(newChecked);
      }
      resolvedOnCheckedChange?.(newChecked, eventDetails);
    };

    return (
      <BaseCheckbox.Root
        ref={ref}
        onCheckedChange={handleCheckedChange}
        disabled={disabled ?? readOnly}
        {...(isControlled
          ? { checked: controlledChecked }
          : { defaultChecked })}
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
        // nativeButton
        // render={
        //   <motion.button
        //     whileTap={(disabled ?? readOnly) ? undefined : { scale: 0.85 }}
        //     transition={{ type: 'spring', duration: 0.3, bounce: 0.3 }}
        //   />
        // }
      >
        <BaseCheckbox.Indicator className="text-primary flex" keepMounted>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={checkboxIndicatorVariants({ size })}
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
