/**
 * The interview/new route should create a new interview item in the database,
 * and then redirect to the interview/[id]/1 route.
 */

import { redirect } from 'next/navigation';
import { trpc } from '~/app/_trpc/server';

export default async function Page() {
  // check if active protocol exists
  console.log('page rendered');
  const activeProtocol = await trpc.protocol.getActive.query();
  if (!activeProtocol) {
    console.log('No active protocol');
    return <div>No active protocol</div>;
  }
  // check if anonymous recruitment is enabled
  const { allowAnonymousRecruitment } =
    await trpc.metadata.get.allSetupMetadata.query();

  if (!allowAnonymousRecruitment) {
    // TODO: decide what to do here
    return <div>Anonymous recruitment disabled.</div>;
  }

  // Anonymous recruitment is enabled

  // Create a new interview
  const { createdInterview } = await trpc.interview.create.mutate();

  if (!createdInterview) {
    console.error('Error creating interview');
    return;
  }

  // Redirect to the interview/[id] route
  redirect(`/interview/${createdInterview.id}`);

  return (
    <div>
      <h1>Interview created</h1>
      {JSON.stringify(createdInterview)}
    </div>
  );
}
