import { PlusIcon } from 'lucide-react';
import { forwardRef } from 'react';
import { cva, cx, type VariantProps } from '@codaco/fresco-ui/utils/cva';
import Icon, { type InterviewerIconName } from '@codaco/fresco-ui/Icon';
import {
  actionCircleVariants,
  actionIconClass,
  actionPlusBadgeVariants,
  actionPlusIconClass,
} from '~/lib/interviewer/components/actionButtonVariants';

const actionButtonVariants = cva({
  base: 'group focusable relative mt-2 mr-4 flex aspect-square h-26 rounded-full',
  variants: {
    disabled: {
      true: 'pointer-events-none cursor-not-allowed opacity-50',
      false: 'cursor-pointer',
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

const mainIconVariants = cva({
  base: cx(
    actionCircleVariants(),
    'bg-sea-green absolute inset-0 scale-100 text-white',
  ),
  variants: {
    disabled: {
      true: 'pointer-events-none cursor-not-allowed opacity-50',
      false:
        'transition-transform duration-300 ease-in-out group-hover:scale-105',
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

const plusContainerVariants = actionPlusBadgeVariants;

const plusIconVariants = cva({
  base: actionPlusIconClass,
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
        aria-label="Add a person"
        ref={ref}
        {...rest}
        className={cx(actionButtonVariants({ disabled }), className)}
      >
        <div className={mainIconVariants({ disabled })}>
          <Icon name={iconName} className={actionIconClass} />
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
