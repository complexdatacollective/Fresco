/**
 * The interview/new route should create a new interview item in the database,
 * and then redirect to the interview/[id]/1 route.
 */

import { redirect } from 'next/navigation';
import { trpc } from '~/app/_trpc/server';

export default async function Page() {
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
}
