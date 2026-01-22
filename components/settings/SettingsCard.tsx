import { type ReactNode } from 'react';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import { Skeleton } from '~/components/ui/skeleton';
import { cx } from '~/utils/cva';

type SettingsCardProps = {
  id?: string;
  title: string;
  children: ReactNode;
  controlArea?: ReactNode;
  divideChildren?: boolean;
  variant?: 'default' | 'destructive';
  className?: string;
};

export default function SettingsCard({
  id,
  title,
  children,
  controlArea,
  divideChildren = false,
  variant = 'default',
  className,
}: SettingsCardProps) {
  return (
    <Surface
      id={id}
      className={cx(
        'w-full max-w-3xl scroll-mt-32',
        controlArea && 'flex gap-10',
        className,
        variant === 'destructive' && 'border-destructive border',
        'tablet:flex-row flex-col',
      )}
      maxWidth="none"
      baseSize="content"
      noContainer
    >
      <div className={cx(controlArea && 'flex-1')}>
        <Heading
          level="h4"
          variant="all-caps"
          margin="none"
          className={cx(divideChildren ? 'mb-4' : 'mb-2')}
        >
          {title}
        </Heading>
        {divideChildren ? (
          <div className="divide-y divide-current/10">{children}</div>
        ) : (
          children
        )}
      </div>
      {controlArea && (
        <div className="flex shrink-0 flex-col items-end justify-center">
          {controlArea}
        </div>
      )}
    </Surface>
  );
}

export function SettingsCardSkeleton({
  rows = 2,
  hasControlArea = false,
  className,
}: {
  rows?: number;
  hasControlArea?: boolean;
  className?: string;
}) {
  if (hasControlArea) {
    return (
      <Surface
        className={cx(
          'w-full max-w-3xl scroll-mt-32',
          className,
          'tablet:flex-row flex-col',
        )}
        maxWidth="none"
        baseSize="content"
        noContainer
      >
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex min-w-32 shrink-0 flex-col items-end justify-center">
          <Skeleton className="h-10 w-24" />
        </div>
      </Surface>
    );
  }

  return (
    <Surface
      className={cx(
        'w-full max-w-3xl scroll-mt-32',
        className,
        'tablet:flex-row flex-col',
      )}
      maxWidth="none"
      baseSize="content"
      noContainer
    >
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
