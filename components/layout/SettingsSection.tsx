import { type ReactNode } from 'react';
import { cn } from '~/utils/shadcn';
import { Skeleton } from '../ui/skeleton';
import Heading from '../ui/typography/Heading';
import Section from './Section';

export default function SettingsSection({
  heading,
  children,
  controlArea,
  classNames,
}: {
  heading: string;
  children: ReactNode;
  controlArea: ReactNode;
  classNames?: string;
}) {
  return (
    <Section classNames={cn(classNames, 'flex gap-10')}>
      <div className="flex-1">
        <Heading variant="h4-all-caps" className="mb-2">
          {heading}
        </Heading>
        {children}
      </div>
      <div className="flex min-w-32 flex-shrink-0 flex-col items-end justify-center">
        {controlArea}
      </div>
    </Section>
  );
}

export function SettingsSectionSkeleton({
  controlAreaSkelton,
}: {
  controlAreaSkelton: ReactNode;
}) {
  return (
    <Section classNames="flex gap-10">
      <div className="flex-1 space-y-6">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-12 w-3/4" />
      </div>
      <div className="flex min-w-32 flex-shrink-0 flex-col items-end justify-center">
        {controlAreaSkelton}
      </div>
    </Section>
  );
}
