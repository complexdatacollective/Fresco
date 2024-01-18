'use client';

import { DataTable } from '~/components/DataTable/DataTable';
import { InterviewColumns } from '~/app/(dashboard)/dashboard/_components/InterviewsTable/Columns';
import { api } from '~/trpc/client';
import { type Interview } from '@prisma/client';
import { ActionsDropdown } from '~/app/(dashboard)/dashboard/_components/InterviewsTable/ActionsDropdown';
import { useState } from 'react';
import { DeleteInterviewsDialog } from '../../interviews/_components/DeleteInterviewsDialog';

export const InterviewsTable = () => {
  const [interviews] = api.interview.get.all.useSuspenseQuery();

  const [interviewsToDelete, setInterviewsToDelete] = useState<Interview[]>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = (data: Interview[]) => {
    setInterviewsToDelete(data);
    setShowDeleteModal(true);
  };

  const convertedData = interviews.map((interview) => ({
    ...interview,
    startTime: new Date(interview.startTime),
    finishTime: interview.finishTime ? new Date(interview.finishTime) : null,
    exportTime: interview.exportTime ? new Date(interview.exportTime) : null,
    lastUpdated: new Date(interview.lastUpdated),
  }));

  return (
    <>
      <DeleteInterviewsDialog
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        interviewsToDelete={interviewsToDelete ?? []}
      />
      <DataTable
        columns={InterviewColumns()}
        data={convertedData}
        filterColumnAccessorKey="id"
        handleDeleteSelected={handleDelete}
        actions={ActionsDropdown}
      />
    </>
  );
};
