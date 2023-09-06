/**
 * The interview/new route should create a new interview item in the database,
 * and then redirect to the interview/[id]/1 route.
 */

import type { User } from '@prisma/client';
import { redirect } from 'next/navigation';
import { getServerAuthSession } from '~/utils/auth';
import { prisma } from '~/utils/db';

const createInterview = async (user: User, protocolId: string) => {
  if (!user || !user.id) {
    throw new Error('No user provided');
  }

  if (!protocolId) {
    throw new Error('No protocol ID provided');
  }

  // eslint-disable-next-line local-rules/require-data-mapper
  const interview = await prisma.interview.create({
    data: {
      user: {
        connect: {
          id: user.id,
          // email: user.email,
        },
      },
      network: '',
      protocol: {
        connect: {
          id: protocolId,
        },
      },
    },
  });

  return interview;
};

export default async function Page({ params, searchParams }) {
  // Get the protocol ID from the search params
  const { protocol } = searchParams;

  // Check we have a currently logged in user. Eventually, we want
  // to optionally create a new user automatically as part of the
  // onboarding flow.
  const session = await getServerAuthSession();

  if (!session) {
    redirect('/');
  }

  // Create a new interview
  const interview = await createInterview(session.user, protocol);

  // Redirect to the interview/[id] route
  redirect(`/interview/${interview.id}`);
}
