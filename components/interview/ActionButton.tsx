import { PlusIcon } from 'lucide-react';
import { forwardRef } from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';
import Icon, { type InterviewerIconName } from '../Icon';

const actionButtonVariants = cva({
  base: 'group focusable relative mt-2 mr-4 flex h-26 aspect-square rounded-full',
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
  base: 'bg-primary text-white absolute inset-0 flex items-center justify-center rounded-full elevation-high scale-100 overflow-hidden [&>.lucide]:w-auto [&>.lucide]:h-16 [&>.lucide]:aspect-square',
  variants: {
    disabled: {
      true: 'opacity-50 cursor-not-allowed pointer-events-none',
      false:
        'transition-transform duration-300 ease-in-out group-hover:scale-105',
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

const plusContainerVariants = cva({
  base: 'bg-platinum text-charcoal absolute -top-2 -right-4 flex h-10 w-10 items-center justify-center rounded-full p-5 shadow-md',
});

const plusIconVariants = cva({
  base: 'h-6 w-6',
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
  ({ iconName = 'add-a-person', className, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        {...rest}
        aria-label="Add a person"
        className={cx(actionButtonVariants({ disabled }), className)}
      >
        <div className={mainIconVariants({ disabled })}>
          <Icon name={iconName} className="h-full w-auto" />
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
