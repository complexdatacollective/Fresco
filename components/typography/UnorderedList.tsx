import { cx } from '~/utils/cva';

export default function UnorderedList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ul className={cx('my-2 ml-8 list-disc [&>li]:mt-1', className)}>
      {children}
    </ul>
  );
}
