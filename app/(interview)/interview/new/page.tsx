/**
 * The interview/new route should create a new interview item in the database,
 * and then redirect to the interview/[id]/1 route.
 */

import { redirect } from 'next/navigation';
import { getServerAuthSession } from '~/utils/auth';
import { prisma } from '~/utils/db';

const createInterview = async (user, protocolId) => {
  if (!user) {
    throw new Error('No user provided');
  }

  console.log('create User', user.id, protocolId);

  const interview = await prisma.interview.create({
    data: {
      user: {
        connect: {
          id: user.id,
          // email: user.email,
        },
      },
      protocol: {
        connect: {
          id: protocolId,
        },
      },
    },
  });

  return interview;
};

// interview/new

export default async function Page({ params, searchParams }) {
  console.log('params', params);
  console.log('searchParams', searchParams);
  // Get the protocol ID from the search params
  const { protocol } = searchParams;

  // Check we have a currently logged in user. Eventually, we want
  // to optionally create a new user automatically.
  const session = await getServerAuthSession();

  console.log('session', session);
  if (!session) {
    redirect('/');
  }

  // // Create a new interview
  const interview = await createInterview(session.user, protocol);

  console.log('interview created', interview);

  // Redirect to the interview/[id] route
  redirect(`/interview/${interview.id}`);
}
