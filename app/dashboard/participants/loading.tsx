import ResponsiveContainer from '~/components/ResponsiveContainer';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import Section from '~/components/layout/Section';
import { ButtonSkeleton } from '~/components/ui/Button';
import { cardClasses } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { PageHeaderSkeleton } from '~/components/ui/typography/PageHeader';
import { cn } from '~/utils/shadcn';

export default function Loading() {
  return (
    <>
      <ResponsiveContainer>
        <PageHeaderSkeleton />
      </ResponsiveContainer>

      <ResponsiveContainer>
        <div className={cn(cardClasses, 'flex gap-10 p-6')}>
          <div className="flex-1 space-y-6">
            <Skeleton className="h-6 w-1/2 rounded" />
            <Skeleton className="h-12 rounded" />
          </div>
          <div className="flex min-w-32 flex-shrink-0 flex-col items-end justify-center">
            <div className="flex w-72 flex-col items-center justify-end gap-4">
              <ButtonSkeleton className="w-full" />
              <ButtonSkeleton className="w-full" />
            </div>
          </div>
        </div>
      </ResponsiveContainer>

      <ResponsiveContainer maxWidth="6xl">
        <Section>
          <DataTableSkeleton columnCount={5} filterableColumnCount={3} />
        </Section>
      </ResponsiveContainer>
    </>
  );
}
