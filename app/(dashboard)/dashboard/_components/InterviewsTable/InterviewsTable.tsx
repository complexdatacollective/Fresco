import { DataTable } from '~/components/DataTable/DataTable';
import { InterviewColumns } from '~/app/(main)/_components/InterviewsTable/Columns';
import { safeLoadInterviews } from '~/app/(main)/_components/InterviewsTable/Loader';

const interviews = await safeLoadInterviews;

export const InterviewsTable = () => {
  return (
    <DataTable
      columns={InterviewColumns}
      data={interviews}
      filterColumnAccessorKey="id"
    />
  );
};
