import ResponsiveContainer from '~/components/ResponsiveContainer';
import PageHeader from '~/components/ui/typography/PageHeader';
import { requireAppNotExpired } from '~/queries/appSettings';
import { requirePageAuth } from '~/utils/auth';

export default async function ProtocolsLayout({ children }: { children: React.ReactNode }) {
  await requireAppNotExpired();
  await requirePageAuth();
  
  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="Protocols"
          subHeaderText="Upload and manage your interview protocols."
        />
      </ResponsiveContainer>
      {children}
    </>
  );
}
