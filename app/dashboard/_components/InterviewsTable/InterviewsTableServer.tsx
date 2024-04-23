import { InterviewsTable } from './InterviewsTable';
import { unstable_noStore } from 'next/cache';
import { prisma } from '~/utils/db';

async function getInterviews() {
  unstable_noStore();

  const interviews = await prisma.interview.findMany({
    include: {
      protocol: true,
      participant: true,
    },
  });
  return interviews;
}

export default async function InterviewsTableServer() {
  const initialInterviews = await getInterviews();

  return <InterviewsTable initialInterviews={initialInterviews} />;
}
