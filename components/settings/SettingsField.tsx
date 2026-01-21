import { type ReactNode } from 'react';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { Skeleton } from '~/components/ui/skeleton';
import { cx } from '~/utils/cva';

type SettingsFieldProps = {
  label: string;
  description?: ReactNode;
  control?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export default function SettingsField({
  label,
  description,
  control,
  children,
  className,
}: SettingsFieldProps) {
  return (
    <div className={cx('py-4 first:pt-0 last:pb-0', className)}>
      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0 flex-1">
          <Heading level="label" margin="none">
            {label}
          </Heading>
          {description && (
            <Paragraph margin="none" emphasis="muted" className="mt-1 text-sm">
              {description}
            </Paragraph>
          )}
        </div>
        {control && <div className="flex shrink-0 items-center">{control}</div>}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function SettingsFieldSkeleton({
  hasControl = true,
  hasChildren = false,
}: {
  hasControl?: boolean;
  hasChildren?: boolean;
}) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        {hasControl && <Skeleton className="h-6 w-12 shrink-0" />}
      </div>
      {hasChildren && <Skeleton className="mt-3 h-16 w-full" />}
    </div>
  );
}
