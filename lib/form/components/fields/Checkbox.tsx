'use client';

import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { type ComponentPropsWithoutRef, forwardRef, useState } from 'react';
import {
  controlVariants,
  inputControlVariants,
  interactiveStateVariants,
  smallSizeVariants,
  stateVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, type VariantProps } from '~/utils/cva';

const checkboxRootVariants = compose(
  smallSizeVariants,
  controlVariants,
  inputControlVariants,
  stateVariants,
  interactiveStateVariants,
  cva({
    base: 'focusable flex aspect-square items-center justify-center',
  }),
);

const checkboxIndicatorVariants = compose(
  smallSizeVariants,
  cva({
    base: 'focusable',
  }),
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
  ({ className, size = 'md', onCheckedChange, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = useState(
      props.checked ?? props.defaultChecked ?? false,
    );

    const isControlled = props.checked !== undefined;
    const isChecked = isControlled ? props.checked : internalChecked;

    const pathLength = useMotionValue(isChecked ? 1 : 0);
    const strokeLinecap = useTransform(() =>
      pathLength.get() === 0 ? 'none' : 'round',
    );

    const handleCheckedChange: NonNullable<
      ComponentPropsWithoutRef<typeof BaseCheckbox.Root>['onCheckedChange']
    > = (newChecked, eventDetails) => {
      if (props.readOnly) return;
      if (!isControlled) {
        setInternalChecked(newChecked);
      }
      onCheckedChange?.(newChecked, eventDetails);
    };

    const getState = () => {
      if (props.disabled) return 'disabled';
      if (props.readOnly) return 'readOnly';
      if (props['aria-invalid']) return 'invalid';
      return 'normal';
    };

    return (
      <BaseCheckbox.Root
        ref={ref}
        onCheckedChange={handleCheckedChange}
        {...props}
        render={({
          onDrag: _onDrag,
          onDragEnd: _onDragEnd,
          onDragStart: _onDragStart,
          onAnimationStart: _onAnimationStart,
          ...rest
        }) => (
          <motion.button
            {...rest}
            className={checkboxRootVariants({
              size,
              className,
              state: getState(),
            })}
          >
            <div className={checkboxIndicatorVariants({ size })}>
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
        )}
      />
    );
  },
);

Checkbox.displayName = 'Checkbox';
