import { AlertCircle } from 'lucide-react';
import Link from '~/components/Link';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/Alert';
import { api } from '~/trpc/server';

export const dynamic = 'force-dynamic';

export default async function AnonymousRecruitmentWarning() {
  const allowAnonymousRecruitment =
    await api.appSettings.getAnonymousRecruitmentStatus.query();

  if (!allowAnonymousRecruitment) {
    return null;
  }

  return (
    <ResponsiveContainer>
      <Alert variant="info">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Please Note</AlertTitle>
        <AlertDescription>
          Anonymous recruitment is enabled. This means that participants can
          self-enroll in your study without needing to be invited, by visiting
          the protocol-specific onboarding link. To disable anonymous
          recruitment, visit{' '}
          <Link href="/dashboard/settings">the settings page</Link>.
        </AlertDescription>
      </Alert>
    </ResponsiveContainer>
  );
}
