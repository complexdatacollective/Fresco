import { cx } from '~/utils/cva';

export default function UnorderedList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ul className={cx('ml-8 list-disc not-last:mb-4', className)}>
      {children}
    </ul>
  );
}
