import { PlusIcon } from 'lucide-react';
import type dynamicIconImports from 'lucide-react/dynamicIconImports';
import { forwardRef } from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';
import Icon, { type InterviewerIconName } from '../Icon';

export type NodeIcon = keyof typeof dynamicIconImports;

const actionButtonVariants = cva({
  base: 'group focusable relative mt-2 mr-4 flex h-40 aspect-square rounded-full',
  variants: {
    disabled: {
      true: 'cursor-not-allowed opacity-50 pointer-events-none',
      false: 'cursor-pointer',
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

const mainIconVariants = cva({
  base: 'bg-primary text-white absolute inset-0 flex items-center justify-center rounded-full shadow-2xl scale-90 overflow-hidden',
  variants: {
    disabled: {
      true: 'opacity-50 cursor-not-allowed pointer-events-none',
      false:
        'transition-transform duration-300 ease-in-out group-hover:scale-100',
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

const plusContainerVariants = cva({
  base: 'bg-platinum text-charcoal absolute -top-2 -right-4 flex h-16 w-16 items-center justify-center rounded-full p-5 shadow-md',
});

const plusIconVariants = cva({
  base: 'h-10 w-10',
  variants: {
    disabled: {
      false:
        'transition-transform duration-300 ease-in-out group-hover:rotate-90 group-focus:rotate-90',
      true: '',
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

type ActionButtonProps = Omit<React.ComponentProps<'button'>, 'ref' | 'color'> &
  VariantProps<typeof actionButtonVariants> & {
    iconName: InterviewerIconName;
  };

const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ iconName, className, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        {...rest}
        aria-label="Add a person"
        className={cx(actionButtonVariants({ disabled }), className)}
      >
        <div className={mainIconVariants({ disabled })}>
          <Icon name={iconName} className="h-full w-full" />
        </div>
        <div className={plusContainerVariants()}>
          <div>
            <PlusIcon
              className={plusIconVariants({ disabled })}
              strokeWidth={3}
            />
          </div>
        </div>
      </button>
    );
  },
);

ActionButton.displayName = 'ActionButton';

export default ActionButton;
