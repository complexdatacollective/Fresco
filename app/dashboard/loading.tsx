import ResponsiveContainer from '~/components/ResponsiveContainer';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import Section from '~/components/layout/Section';
import { PageHeaderSkeleton } from '~/components/ui/typography/PageHeader';
import { SummaryStatisticsSkeleton } from './_components/SummaryStatistics/SummaryStatistics';
import { AnonymousRecruitmentWarningSkeleton } from './protocols/_components/AnonymousRecruitmentWarningClient';

export default function Loading() {
  return (
    <>
      <ResponsiveContainer>
        <PageHeaderSkeleton />
      </ResponsiveContainer>
      <AnonymousRecruitmentWarningSkeleton />
      <SummaryStatisticsSkeleton />
      <ResponsiveContainer>
        <PageHeaderSkeleton />
      </ResponsiveContainer>
      <ResponsiveContainer maxWidth="6xl">
        <Section>
          <DataTableSkeleton columnCount={3} filterableColumnCount={1} />
        </Section>
      </ResponsiveContainer>
    </>
  );
}
