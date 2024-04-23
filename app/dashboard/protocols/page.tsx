import ResponsiveContainer from '~/components/ResponsiveContainer';
import { ProtocolsTable } from '../_components/ProtocolsTable/ProtocolsTable';
import PageHeader from '~/components/ui/typography/PageHeader';
import Section from '~/components/layout/Section';

const ProtocolsPage = () => {
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
          <ProtocolsTable />
        </Section>
      </ResponsiveContainer>
    </>
  );
};

export default ProtocolsPage;
