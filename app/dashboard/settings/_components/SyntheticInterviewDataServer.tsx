import { Suspense } from 'react';

import SyntheticInterviewDataSection from '~/app/dashboard/settings/_components/SyntheticInterviewDataSection';
import { getProtocols } from '~/queries/protocols';
import { getSyntheticInterviewCount } from '~/queries/synthetic-interviews';

export default async function SyntheticInterviewDataServer() {
  const protocolsPromise = getProtocols();
  const initialCounts = await getSyntheticInterviewCount();

  return (
    <Suspense fallback="Loading...">
      <SyntheticInterviewDataSection
        protocolsPromise={protocolsPromise}
        initialCounts={initialCounts}
      />
    </Suspense>
  );
}
