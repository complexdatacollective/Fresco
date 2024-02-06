import ResponsiveContainer from '~/components/ResponsiveContainer';
import { ProtocolsTable } from '../_components/ProtocolsTable/ProtocolsTable';
import PageHeader from '~/components/ui/typography/PageHeader';
import Section from '~/components/layout/Section';
import { unstable_noStore } from 'next/cache';
import AnonymousRecruitmentWarning from './_components/AnonymousRecruitmentWarning';
import { api } from '~/trpc/server';

const ProtocolsPage = async () => {
  unstable_noStore();
  const protocols = await api.protocol.get.all.query();

  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="Protocols"
          subHeaderText="Upload and manage your interview protocols."
        />
      </ResponsiveContainer>
      <ResponsiveContainer>
        <AnonymousRecruitmentWarning />
      </ResponsiveContainer>
      <ResponsiveContainer maxWidth="5xl">
        <Section>
          <ProtocolsTable initialData={protocols} />
        </Section>
      </ResponsiveContainer>
    </>
  );
};

export default ProtocolsPage;
