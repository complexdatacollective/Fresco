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
        'mt-4 ml-8 list-disc text-base [&>li]:mt-2 [li>&]:mt-0',
        className,
      )}
    >
      {children}
    </ul>
  );
}
