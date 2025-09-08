import { cn } from '~/lib/utils';

export default function Node({
  label,
  size = 'lg',
}: {
  label: string;
  size?: 'sm' | 'lg';
} & React.HTMLAttributes<HTMLButtonElement>) {
  const labelWithEllipsis =
    label.length < 22 ? label : `${label.substring(0, 18)}\u{AD}...`; // Add ellipsis for really long labels

  const labelClasses = cn(
    'whitespace-pre-line overflow-hidden text-center hyphens-auto text-wrap break-all px-6',
    size === 'sm' ? 'text-sm' : 'text-base',
  );

  // TODO: move to variants using TWV
  const nodeSizeClasses = size === 'sm' ? 'h-24 w-24' : 'h-36 w-36';

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-node-1 text-node-1-foreground',
        'bg-[repeating-linear-gradient(145deg,transparent,transparent_50%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.1)_100%)]',
        nodeSizeClasses,
      )}
      aria-label={label}
    >
      <span className={labelClasses}>{labelWithEllipsis}</span>
    </button>
  );
}
