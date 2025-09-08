import { PlusIcon } from 'lucide-react';
import { cn } from '~/lib/utils';
import type { NodeColor, NodeIcon } from '~/schemas/protocol/entities';
import DynamicLucideIcon from '../DynamicLucideIcon';

type ActionButtonProps = React.ComponentProps<'button'> & {
  iconName: NodeIcon;
  color: NodeColor;
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
      className={cn(
        'group relative mr-4 mt-2 flex h-40 w-40 rounded-full',
        className,
      )}
    >
      <div
        className={cn(
          color === 'node-1' && 'bg-node-1 text-node-1-foreground',
          color === 'node-2' && 'bg-node-2 text-node-2-foreground',
          color === 'node-3' && 'bg-node-3 text-node-3-foreground',
          color === 'node-4' && 'bg-node-4 text-node-4-foreground',
          color === 'node-5' && 'bg-node-5 text-node-5-foreground',
          color === 'node-6' && 'bg-node-6 text-node-6-foreground',
          color === 'node-7' && 'bg-node-7 text-node-7-foreground',
          color === 'node-8' && 'bg-node-8 text-node-8-foreground',
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
      <div className="absolute -right-4 -top-2 flex h-16 w-16 items-center justify-center rounded-full bg-muted p-5 text-muted-foreground shadow-md">
        <div>
          <PlusIcon
            className="h-10 w-10 transition-transform duration-300 ease-in-out group-hover:rotate-90"
            strokeWidth={3}
          />
        </div>
      </div>
    </button>
  );
}
