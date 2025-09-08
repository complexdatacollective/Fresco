import { cn } from '~/lib/utils';

export default function Divider({ className }: { className?: string }) {
  return (
    <hr
      className={cn(
        'my-6 h-[1px] bg-[color-mix(in_oklch,currentColor_10%,_transparent)]',
        className,
      )}
    />
  );
}
