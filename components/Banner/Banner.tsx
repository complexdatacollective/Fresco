import { cn } from '~/utils/shadcn';

export default function Banner({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-background text-foreground relative isolate z-50 flex w-full items-center justify-center gap-x-6 overflow-hidden px-6 py-1.5 sm:px-3.5',
        className,
      )}
    >
      {children}
    </div>
  );
}
