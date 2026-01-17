import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import Section from '~/components/layout/Section';
import PageHeader from '~/components/typography/PageHeader';

export default function Loading() {
  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="Protocols"
          subHeaderText="Upload and manage your interview protocols."
        />
      </ResponsiveContainer>
      <ResponsiveContainer maxWidth="6xl">
        <Section>
          <DataTableSkeleton columnCount={4} filterableColumnCount={1} />
        </Section>
      </ResponsiveContainer>
    </>
  );
}
