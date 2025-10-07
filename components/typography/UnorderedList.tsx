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
        'mb-4 ml-8 list-disc text-base [&>li]:mb-2 [li>&]:mb-0',
        className,
      )}
    >
      {children}
    </ul>
  );
}
