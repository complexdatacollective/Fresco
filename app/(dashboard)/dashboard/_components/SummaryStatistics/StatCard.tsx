'use client';

import { use } from 'react';
import { Skeleton } from '~/components/ui/skeleton';
import Heading from '~/components/ui/typography/Heading';
import { cn } from '~/utils/shadcn';

const statCardClasses = cn(
  'flex flex-col gap-4 rounded-xl border border-[hsl(var(--platinum--dark))] bg-card p-4 text-card-foreground shadow-xl shadow-platinum-dark transition-all',
  'sm:flex-row sm:items-center md:p-6 lg:gap-6 lg:p-10',
  ' hover:scale-[102%]',
);
function StatCard({
  title,
  valuePromise,
  icon,
}: {
  title: string;
  valuePromise: Promise<number>;
  icon: React.ReactNode;
}) {
  const value = use(valuePromise);

  return (
    <div className={statCardClasses}>
      <div className="hidden md:block">{icon}</div>
      <div>
        <Heading variant="h4-all-caps">{title}</Heading>
        <Heading variant="h1">{value}</Heading>
      </div>
    </div>
  );
}

export function StatCardSkeleton({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={statCardClasses}>
      <div className="hidden md:block">{icon}</div>
      <div>
        <Heading variant="h4-all-caps">{title}</Heading>
        <Skeleton className="mt-2 h-10 w-32" />
      </div>
    </div>
  );
}

export default StatCard;
