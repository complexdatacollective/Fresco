'use client';

import { Checkbox as BaseCheckbox } from '@base-ui-components/react/checkbox';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { type ComponentPropsWithoutRef, forwardRef, useState } from 'react';
import {
  checkboxContainerVariants,
  checkboxIndicatorSizeVariants,
  checkboxIndicatorVariants,
  controlStateVariants,
  smallSizeVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, type VariantProps } from '~/utils/cva';

const checkboxRootVariants = compose(
  smallSizeVariants,
  checkboxContainerVariants,
  controlStateVariants,
  cva({
    base: 'aspect-square',
  }),
);

const checkboxIndicatorComposedVariants = compose(
  checkboxIndicatorSizeVariants,
  checkboxIndicatorVariants,
);

export type CheckboxProps = Omit<
  ComponentPropsWithoutRef<typeof BaseCheckbox.Root>,
  'size'
> &
  VariantProps<typeof checkboxRootVariants> & {
    invalid?: boolean;
    readOnly?: boolean;
  };

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    {
      className,
      size = 'md',
      invalid,
      readOnly,
      checked,
      onCheckedChange,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [internalChecked, setInternalChecked] = useState(
      checked ?? props.defaultChecked ?? false,
    );

    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : internalChecked;

    // Work out variant state based on props. Order:
    // disabled > readOnly > invalid > normal
    const getState = () => {
      if (disabled) return 'disabled';
      if (readOnly) return 'readOnly';
      if (invalid) return 'invalid';
      return 'normal';
    };

    const handleCheckedChange = (
      newChecked: boolean,
      eventDetails: {
        reason: 'none';
        event: Event;
        cancel: () => void;
        allowPropagation: () => void;
        isCanceled: boolean;
        isPropagationAllowed: boolean;
      },
    ) => {
      if (readOnly) return;
      if (!isControlled) {
        setInternalChecked(newChecked);
      }
      onCheckedChange?.(newChecked, eventDetails);
    };

    return (
      <BaseCheckbox.Root
        ref={ref}
        className={checkboxRootVariants({ size, state: getState(), className })}
        checked={checked}
        onCheckedChange={handleCheckedChange}
        disabled={disabled ?? readOnly}
        aria-readonly={readOnly}
        {...props}
      >
        <BaseCheckbox.Indicator
          keepMounted
          className={checkboxIndicatorComposedVariants({ size })}
        >
          <motion.div
            initial={false}
            animate={{
              scale: isChecked ? 1 : 0,
              opacity: isChecked ? 1 : 0,
            }}
            transition={{
              type: 'spring',
            }}
            className="flex h-full w-full items-center justify-center"
          >
            <Check className="h-full w-full" />
          </motion.div>
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
    );
  },
);

Checkbox.displayName = 'Checkbox';
