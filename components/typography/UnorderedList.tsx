import { cx } from '~/utils/cva';

export default function UnorderedList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ul
      className={cx(
        'ml-8 list-disc text-base not-last:mb-4 [&>li]:my-2 [li>&]:mb-0',
        className,
      )}
    >
      {children}
    </ul>
  );
}
