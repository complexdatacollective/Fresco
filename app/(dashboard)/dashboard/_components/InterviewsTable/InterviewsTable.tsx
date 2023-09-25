'use client';

import { DataTable } from '~/components/DataTable/DataTable';
import { InterviewColumns } from '~/app/(dashboard)/dashboard/_components/InterviewsTable/Columns';
import { trpc } from '~/app/_trpc/client';
import { type Interview } from '@prisma/client';

export const InterviewsTable = () => {
  const interviews = trpc.interview.get.useQuery();
  const { mutateAsync: deleteInterview } =
    trpc.interview.deleteSingle.useMutation({
      async onSuccess() {
        await interviews.refetch();
      },
    });

  const { mutateAsync: deleteInterviews } =
    trpc.interview.deleteMany.useMutation({
      async onSuccess() {
        await interviews.refetch();
      },
    });

  const handleDelete = async (id: string) => {
    const result = await deleteInterview({ id });
    if (result.error) throw new Error(result.error);
  };

  const handleDeleteSelected = async (data: Interview[]) => {
    const result = await deleteInterviews(data);
    if (result.error) throw new Error(result.error);
  };
  if (!interviews.data) {
    return <div>Loading...</div>;
  }
  return (
    <DataTable
      columns={InterviewColumns(handleDelete)}
      data={interviews.data}
      filterColumnAccessorKey="id"
      handleDeleteSelected={handleDeleteSelected}
    />
  );
};
