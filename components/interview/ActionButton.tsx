import { PlusIcon } from 'lucide-react';
import type dynamicIconImports from 'lucide-react/dynamicIconImports';
import { type NodeColorSequence } from '~/lib/ui/components/Node';
import { cx } from '~/utils/cva';
import DynamicLucideIcon from '../DynamicLucideIcon';

export type NodeIcon = keyof typeof dynamicIconImports;

type ActionButtonProps = React.ComponentProps<'button'> & {
  iconName: NodeIcon;
  color: NodeColorSequence;
};

export default function ActionButton({
  iconName,
  className,
  color,
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
          'text-white',
          color === 'node-color-seq-1' && 'bg-[var(--node-color-seq-1)]',
          color === 'node-color-seq-2' && 'bg-[var(--node-color-seq-2)]',
          color === 'node-color-seq-3' && 'bg-[var(--node-color-seq-3)]',
          color === 'node-color-seq-4' && 'bg-[var(--node-color-seq-4)]',
          color === 'node-color-seq-5' && 'bg-[var(--node-color-seq-5)]',
          color === 'node-color-seq-6' && 'bg-[var(--node-color-seq-6)]',
          color === 'node-color-seq-7' && 'bg-[var(--node-color-seq-7)]',
          color === 'node-color-seq-8' && 'bg-[var(--node-color-seq-8)]',
          'scale-90 transition-transform duration-300 ease-in-out group-hover:scale-100',
          'absolute inset-0 flex items-center justify-center rounded-full shadow-2xl',
          'bg-[repeating-linear-gradient(145deg,transparent,transparent_50%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.1)_100%)]',
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
