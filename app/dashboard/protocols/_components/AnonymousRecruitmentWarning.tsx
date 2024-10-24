import { AlertCircle } from 'lucide-react';
import Link from '~/components/Link';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { getAppSetting } from '~/queries/appSettings';

export default async function AnonymousRecruitmentWarning() {
  const allowAnonymousRecruitment = await getAppSetting(
    'allowAnonymousRecruitment',
  );

  if (!allowAnonymousRecruitment) return null;

  return (
    <Alert variant="info">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Please Note</AlertTitle>
      <AlertDescription>
        Anonymous recruitment is enabled. This means that participants can
        self-enroll in your study without needing to be invited, by visiting the
        protocol-specific onboarding link. To disable anonymous recruitment,
        visit <Link href="/dashboard/settings">the settings page</Link>.
      </AlertDescription>
    </Alert>
  );
}
