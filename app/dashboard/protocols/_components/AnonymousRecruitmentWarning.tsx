import { Suspense } from 'react';
import { getAnonymousRecruitmentStatus } from '~/queries/appSettings';
import AnonymousRecruitmentWarningClient, {
  AnonymousRecruitmentWarningSkeleton,
} from './AnonymousRecruitmentWarningClient';

export default function AnonymousRecruitmentWarning() {
  const allowAnonymousRecruitment = getAnonymousRecruitmentStatus();

  return (
    <Suspense fallback={<AnonymousRecruitmentWarningSkeleton />}>
      <AnonymousRecruitmentWarningClient data={allowAnonymousRecruitment} />
    </Suspense>
  );
}
