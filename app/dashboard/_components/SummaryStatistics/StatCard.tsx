import { use } from 'react';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import { Skeleton } from '~/components/ui/skeleton';
import { cx } from '~/utils/cva';

const statCardClasses = cx(
  'flex flex-col gap-4 transition-all',
  '@3xs:flex-row @3xs:items-center @lg:gap-6',
  'hover:scale-[102%]',
  'w-full rounded outline-none',
  'tablet:px-6 tablet:py-8 px-4 py-6',
);
function StatCard({
  title,
  dataPromise,
  render,
  icon,
}: {
  title: string;
  dataPromise: Promise<Record<string, number>>;
  render: string;
  icon: React.ReactNode;
}) {
  const data = use(dataPromise);

  return (
    <Surface className={statCardClasses} spacing="none">
      <div className="hidden @3xs:block">{icon}</div>
      <div>
        <Heading level="h4" variant="all-caps" margin="none">
          {title}
        </Heading>
        <Heading level="h1" margin="none">
          {data[render]}
        </Heading>
      </div>
    </Surface>
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
    <Surface className={statCardClasses}>
      <div className="tablet:block hidden">{icon}</div>
      <div>
        <Heading level="h4" variant="all-caps">
          {title}
        </Heading>
        <Skeleton className="mt-2 h-10 w-32" />
      </div>
    </Surface>
  );
}

export default StatCard;
