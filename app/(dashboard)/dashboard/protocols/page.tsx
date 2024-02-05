import ResponsiveContainer from '~/components/ResponsiveContainer';
import ProtocolUploader from '../_components/ProtocolUploader';
import { ProtocolsTable } from '../_components/ProtocolsTable/ProtocolsTable';
import { api } from '~/trpc/server';
import PageHeader from '~/components/ui/typography/PageHeader';
import Section from '~/components/layout/Section';

const ProtocolsPage = async () => {
  const protocols = await api.protocol.get.all.query();

  return (
    <>
      <ProtocolUploader />
      <ResponsiveContainer>
        <PageHeader
          headerText="Protocols"
          subHeaderText="Upload and manage your interview protocols."
        />
      </ResponsiveContainer>
      <ResponsiveContainer></ResponsiveContainer>
      <ResponsiveContainer maxWidth="5xl">
        <Section>
          <ProtocolsTable initialData={protocols} />
        </Section>
      </ResponsiveContainer>
    </>
  );
};

export default ProtocolsPage;
