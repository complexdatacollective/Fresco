import { cn } from '~/utils/shadcn';

export default function UnorderedList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ul className={cn('my-2 ml-8 list-disc [&>li]:mt-1', className)}>
      {children}
    </ul>
  );
}
