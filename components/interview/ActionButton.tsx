import { PlusIcon } from 'lucide-react';
import type dynamicIconImports from 'lucide-react/dynamicIconImports';
import { cx } from '~/utils/cva';
import DynamicLucideIcon from '../DynamicLucideIcon';

export type NodeIcon = keyof typeof dynamicIconImports;

type ActionButtonProps = React.ComponentProps<'button'> & {
  iconName: NodeIcon;
};

export default function ActionButton({
  iconName,
  className,
  ...rest
}: ActionButtonProps) {
  return (
    <button
      {...rest}
      aria-label="Add a person"
      className={cx(
        'group focusable relative mt-2 mr-4 flex h-40 w-40 rounded-full',
        className,
      )}
    >
      <div
        className={cx(
          'bg-primary text-white',
          'scale-90 transition-transform duration-300 ease-in-out group-hover:scale-100',
          'absolute inset-0 flex items-center justify-center rounded-full shadow-2xl',
        )}
      >
        <DynamicLucideIcon
          name={iconName}
          className="h-24 w-24"
          strokeWidth={1.5}
        />
      </div>
      <div className="bg-platinum text-charcoal absolute -top-2 -right-4 flex h-16 w-16 items-center justify-center rounded-full p-5 shadow-md">
        <div>
          <PlusIcon
            className="h-10 w-10 transition-transform duration-300 ease-in-out group-hover:rotate-90 group-focus:rotate-90"
            strokeWidth={3}
          />
        </div>
      </div>
    </button>
  );
}
