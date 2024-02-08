import ResponsiveContainer from '~/components/ResponsiveContainer';
import { ProtocolsTable } from '../_components/ProtocolsTable/ProtocolsTable';
import PageHeader from '~/components/ui/typography/PageHeader';
import Section from '~/components/layout/Section';
import { api } from '~/trpc/server';

const ProtocolsPage = async () => {
  const protocols = await api.protocol.get.all.query();
  const allowAnonymousRecruitment =
    await api.appSettings.getAnonymousRecruitmentStatus.query();

  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="Protocols"
          subHeaderText="Upload and manage your interview protocols."
        />
      </ResponsiveContainer>
      <ResponsiveContainer maxWidth="5xl">
        <Section>
          <ProtocolsTable
            initialData={protocols}
            allowAnonymousRecruitment={!!allowAnonymousRecruitment}
          />
        </Section>
      </ResponsiveContainer>
    </>
  );
};

export default ProtocolsPage;
