'use client';

import { DataTable } from '~/components/DataTable/DataTable';
import { InterviewColumns } from '~/app/(dashboard)/dashboard/_components/InterviewsTable/Columns';
import { trpc } from '~/app/_trpc/client';
import { type Interview } from '@prisma/client';

type InterviewWithoutNetwork = Omit<Interview, 'network'>;

export const InterviewsTable = () => {
  const interviews = trpc.interview.get.all.useQuery();
  if (interviews.error) {
    throw new Error(interviews.error.message);
  }

  const { mutateAsync: deleteInterview } =
    trpc.interview.deleteSingle.useMutation({
      async onSuccess() {
        await interviews.refetch();
      },
      onError(error) {
        throw new Error(error.message);
      },
    });

  const { mutateAsync: deleteInterviews } =
    trpc.interview.deleteMany.useMutation({
      async onSuccess() {
        await interviews.refetch();
      },
      onError(error) {
        throw new Error(error.message);
      },
    });

  const handleDelete = async (id: string) => {
    await deleteInterview({ id });
  };

  if (!interviews.data) {
    return <div>Loading...</div>;
  }

  const convertedData: InterviewWithoutNetwork[] = interviews.data.map(
    (interview) => ({
      ...interview,
      startTime: new Date(interview.startTime),
      finishTime: interview.finishTime ? new Date(interview.finishTime) : null,
      exportTime: interview.exportTime ? new Date(interview.exportTime) : null,
      lastUpdated: new Date(interview.lastUpdated),
    }),
  );

  return (
    <DataTable
      columns={InterviewColumns(handleDelete)}
      data={convertedData}
      filterColumnAccessorKey="id"
      handleDeleteSelected={async (data: InterviewWithoutNetwork[]) => {
        await deleteInterviews(data);
      }}
    />
  );
};
