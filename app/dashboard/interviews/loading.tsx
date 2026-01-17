import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import Section from '~/components/layout/Section';
import PageHeader from '~/components/typography/PageHeader';

export default function Loading() {
  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="Interviews"
          subHeaderText="View and manage your interview data."
        />
      </ResponsiveContainer>
      <ResponsiveContainer maxWidth="7xl">
        <Section>
          <DataTableSkeleton columnCount={6} filterableColumnCount={2} />
        </Section>
      </ResponsiveContainer>
    </>
  );
}
