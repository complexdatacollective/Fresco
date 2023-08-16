import { prisma } from '~/utils/db';
import { DataTable } from '~/components/DataTable/DataTable';
import { InterviewColumns } from '~/app/(main)/_components/InterviewsTable/Columns';

const getInterviews = async () => {
  const interviews = await prisma.interview.findMany({
    include: {
      user: {
        select: {
          name: true,
        },
      },
      protocol: true,
    },
  });

  return interviews;
};

const interviews = await getInterviews();

export const InterviewsTable = () => {
  return <DataTable columns={InterviewColumns} data={interviews} />;
};
