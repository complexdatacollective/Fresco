'use client';

import { DataTable } from '~/components/DataTable/DataTable';
import { InterviewColumns } from '~/app/(dashboard)/dashboard/_components/InterviewsTable/Columns';
import { api } from '~/trpc/client';
import { type Interview } from '@prisma/client';
import { ActionsDropdown } from '~/app/(dashboard)/dashboard/_components/InterviewsTable/ActionsDropdown';
import { useState } from 'react';
import { DeleteInterviewsDialog } from '../../interviews/_components/DeleteInterviewsDialog';
import ExportInterviewsButton from '../../interviews/_components/ExportInterviewsButton';

export const InterviewsTable = () => {
  const interviews = api.interview.get.all.useQuery(undefined, {
    onError(error) {
      throw new Error(error.message);
    },
  });

  const [interviewsToDelete, setInterviewsToDelete] = useState<Interview[]>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = (data: Interview[]) => {
    setInterviewsToDelete(data);
    setShowDeleteModal(true);
  };
  if (!interviews.data) {
    return <div>Loading...</div>;
  }

  const convertedData = interviews.data.map((interview) => ({
    ...interview,
    startTime: new Date(interview.startTime),
    finishTime: interview.finishTime ? new Date(interview.finishTime) : null,
    exportTime: interview.exportTime ? new Date(interview.exportTime) : null,
    lastUpdated: new Date(interview.lastUpdated),
  }));

  return (
    <>
      {/* Temporary interview export trigger */}
      <ExportInterviewsButton interviews={interviews.data} />
      {/* Temporary interview export trigger */}
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
