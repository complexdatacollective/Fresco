'use client';

import { Checkbox as BaseCheckbox } from '@base-ui-components/react/checkbox';
import { motion, useMotionValue, useTransform } from 'motion/react';
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

type CheckboxProps = Omit<
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

    const pathLength = useMotionValue(isChecked ? 1 : 0);
    const strokeLinecap = useTransform(() =>
      pathLength.get() === 0 ? 'none' : 'round',
    );

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
        render={(checkboxProps) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const {
            onDrag,
            onDragStart,
            onDragEnd,
            onAnimationStart,
            onAnimationEnd,
            ...rest
          } = checkboxProps;
          void onDrag;
          void onDragStart;
          void onDragEnd;
          void onAnimationStart;
          void onAnimationEnd;
          return (
            <motion.button
              {...rest}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-primary-action
            >
              <div
                className={checkboxIndicatorComposedVariants({ size })}
                style={{
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-full w-full"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <motion.path
                    d="M4 12L10 18L20 6"
                    initial={false}
                    animate={{ pathLength: isChecked ? 1 : 0 }}
                    transition={{
                      type: 'spring',
                      bounce: 0,
                      duration: isChecked ? 0.3 : 0.1,
                    }}
                    style={{
                      pathLength,
                      strokeLinecap,
                    }}
                  />
                </svg>
              </div>
            </motion.button>
          );
        }}
      />
    );
  },
);

Checkbox.displayName = 'Checkbox';
