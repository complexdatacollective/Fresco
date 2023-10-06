/**
 * The interview/new route should create a new interview item in the database,
 * and then redirect to the interview/[id]/1 route.
 */

import { redirect } from 'next/navigation';
import { trpc } from '~/app/_trpc/server';
import { faker } from '@faker-js/faker';

export default async function Page({
  searchParams,
}: {
  searchParams: {
    identifier?: string;
  };
}) {
  // check if active protocol exists
  const activeProtocol = await trpc.protocol.getActive.query();
  if (!activeProtocol) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl font-bold">No Active Protocol</div>
          <p className="max-w-md text-lg">
            There is no active protocol for this account. Researchers may
            optionally mark an uploaded protocol as active from the{' '}
            <a href="/dashboard/protocols">protocols dashboard</a>.
          </p>
        </div>
      </div>
    );
  }
  // check if anonymous recruitment is enabled
  const { allowAnonymousRecruitment } =
    await trpc.metadata.get.allSetupMetadata.query();

  if (!allowAnonymousRecruitment) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl font-bold">
            Anonymous Recruitment Disabled
          </div>
          <p className="max-w-md text-lg">
            Anonymous recruitment is disabled for this study. Reserachers may
            optionally enable anonymous recruitment from the{' '}
            <a href="/dashboard">main dashboard</a>.
          </p>
        </div>
      </div>
    );
  }

  // Anonymous recruitment is enabled

  // Create a new interview
  const identifier = searchParams.identifier || faker.string.uuid();
  const { createdInterview } = await trpc.interview.create.mutate(identifier);

  if (!createdInterview) {
    console.error('Error creating interview');
    return;
  }

  // Redirect to the interview/[id] route
  redirect(`/interview/${createdInterview.id}`);
}
