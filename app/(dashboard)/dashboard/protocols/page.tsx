import ResponsiveContainer from '~/components/ResponsiveContainer';
import ProtocolUploader from '../_components/ProtocolUploader';
import { ProtocolsTable } from '../_components/ProtocolsTable/ProtocolsTable';
import { api } from '~/trpc/server';
import PageHeader from '~/components/ui/typography/PageHeader';
import Section from '~/components/layout/Section';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { AlertCircle } from 'lucide-react';
// import Link from 'next/link';

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
      <ResponsiveContainer>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Anonymous recruitment is enabled. This means that participants can
            self-enroll in your study without needing to be invited. To disable
            anonymous recruitment, click the toggle switch in the
            {/* <Link href="/dashboard/settings">
              <a className="text-blue-600">settings</a>
            </Link> */}
            page.
          </AlertDescription>
        </Alert>
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
