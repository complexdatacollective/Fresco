'use client';

import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { motion, useMotionValue, useTransform } from 'motion/react';
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
    { className, size = 'md', onCheckedChange, disabled, readOnly, ...props },
    ref,
  ) => {
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
              state: getInputState({ disabled, readOnly }),
            })}
          >
            <div className={checkboxIndicatorVariants()}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-full w-full p-[0.1em]"
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

export { Checkbox };
export default Checkbox;
