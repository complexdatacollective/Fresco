import ResponsiveContainer from '~/components/ResponsiveContainer';
import Section from '~/components/layout/Section';
import ProtocolsTable from '../_components/ProtocolsTable/ProtocolsTable';

export default function ProtocolsPage() {
  return (
    <>
      <ResponsiveContainer maxWidth="6xl">
        <Section>
          <ProtocolsTable />
        </Section>
      </ResponsiveContainer>
    </>
  );
}
