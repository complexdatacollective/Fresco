import { cx } from '~/utils/cva';

export default function Banner({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'bg-background text-contrast relative isolate z-50 flex w-full items-center justify-center gap-x-6 overflow-hidden px-6 py-1.5 sm:px-3.5',
        className,
      )}
    >
      {children}
    </div>
  );
}
