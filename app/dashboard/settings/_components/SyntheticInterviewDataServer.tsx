import { Suspense } from 'react';
import { getProtocols } from '~/queries/protocols';
import { getSyntheticInterviewCount } from '~/queries/synthetic-interviews';
import SyntheticInterviewDataSection from '~/app/dashboard/settings/_components/SyntheticInterviewDataSection';

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
