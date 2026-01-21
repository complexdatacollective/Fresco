import { type ReactNode } from 'react';
import { cx } from '~/utils/cva';
import Heading from '../typography/Heading';
import { Skeleton } from '../ui/skeleton';
import Surface from './Surface';

export default function SettingsSection({
  id,
  heading,
  children,
  controlArea,
  classNames,
  devOnly,
}: {
  id?: string;
  heading: string;
  children: ReactNode;
  controlArea?: ReactNode;
  classNames?: string;
  devOnly?: boolean;
}) {
  return (
    <Surface
      id={id}
      className={cx(
        'scroll-mt-6',
        classNames,
        'flex gap-10',
        devOnly && 'border-destructive bg-destructive/5 text-destructive',
      )}
      maxWidth="3xl"
    >
      <div className="flex-1">
        <Heading level="h4" variant="all-caps" className="mb-2">
          {heading}
        </Heading>
        {children}
      </div>
      {controlArea && (
        <div className="flex shrink-0 flex-col items-end justify-center">
          {controlArea}
        </div>
      )}
    </Surface>
  );
}

export function SettingsSectionSkeleton({
  controlAreaSkelton,
}: {
  controlAreaSkelton?: ReactNode;
}) {
  return (
    <Surface className="flex gap-10">
      <div className="flex-1 space-y-6">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-12 w-3/4" />
      </div>
      {controlAreaSkelton && (
        <div className="flex min-w-32 shrink-0 flex-col items-end justify-center">
          {controlAreaSkelton}
        </div>
      )}
    </Surface>
  );
}
