import { AlertCircle } from 'lucide-react';
import { Suspense } from 'react';
import Link from '~/components/Link';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { Skeleton } from '~/components/ui/skeleton';
import { getAnonymousRecruitmentStatus } from '~/queries/appSettings';

export default function AnonymousRecruitmentWarning() {
  return (
    <Suspense fallback={<AnonymousRecruitmentWarningSkeleton />}>
      <AnonymousRecruitmentWarningChild />
    </Suspense>
  );
}

const AnonymousRecruitmentWarningChild = async () => {
  const allowAnonymousRecruitment = await getAnonymousRecruitmentStatus();

  if (!allowAnonymousRecruitment) return null;

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
};

export function AnonymousRecruitmentWarningSkeleton() {
  return (
    <ResponsiveContainer>
      <Alert variant="info" className="space-y-5">
        <div className="flex gap-3">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>

        <Skeleton className="ml-4 h-12" />
      </Alert>
    </ResponsiveContainer>
  );
}
