import { type ReactNode } from 'react';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import { Skeleton } from '~/components/ui/skeleton';
import { cx } from '~/utils/cva';

type SettingsCardProps = {
  id?: string;
  title: string;
  children: ReactNode;
  variant?: 'default' | 'destructive';
  className?: string;
};

export default function SettingsCard({
  id,
  title,
  children,
  variant = 'default',
  className,
}: SettingsCardProps) {
  return (
    <Surface
      id={id}
      spacing="sm"
      maxWidth="3xl"
      className={cx(
        'scroll-mt-6',
        className,
        variant === 'destructive' &&
          'border border-destructive bg-destructive/5 text-destructive',
      )}
    >
      <Heading level="h4" variant="all-caps" margin="none" className="mb-4">
        {title}
      </Heading>
      <div className="divide-y divide-current/10">{children}</div>
    </Surface>
  );
}

export function SettingsCardSkeleton({
  rows = 2,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <Surface spacing="sm" maxWidth="3xl" className={className}>
      <Skeleton className="mb-4 h-5 w-32" />
      <div className="divide-y divide-current/10">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
    </Surface>
  );
}
