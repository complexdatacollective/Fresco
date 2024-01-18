'use client';

import { type Interview } from '@prisma/client';
import { useState } from 'react';
import { ActionsDropdown } from '~/app/(dashboard)/dashboard/_components/InterviewsTable/ActionsDropdown';
import { InterviewColumns } from '~/app/(dashboard)/dashboard/_components/InterviewsTable/Columns';
import { DataTable } from '~/components/DataTable/DataTable';
import { api } from '~/trpc/client';
import { DeleteInterviewsDialog } from '../../interviews/_components/DeleteInterviewsDialog';
import { ExportInterviewsDialog } from '../../interviews/_components/ExportInterviewsDialog';

export const InterviewsTable = () => {
  const interviews = api.interview.get.all.useQuery(undefined, {
    onError(error) {
      throw new Error(error.message);
    },
  });

  const [selectedInterviews, setSelectedInterviews] = useState<Interview[]>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const handleDelete = (data: Interview[]) => {
    setSelectedInterviews(data);
    setShowDeleteModal(true);
  };

  const handleExport = (data: Interview[]) => {
    setSelectedInterviews(data);
    setShowExportModal(true);
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
      <ExportInterviewsDialog
        open={showExportModal}
        setOpen={setShowExportModal}
        setInterviewsToExport={setSelectedInterviews}
        interviewsToExport={selectedInterviews ?? []}
      />
      <DeleteInterviewsDialog
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        interviewsToDelete={selectedInterviews ?? []}
      />
      <DataTable
        columns={InterviewColumns()}
        data={convertedData}
        filterColumnAccessorKey="id"
        handleDeleteSelected={handleDelete}
        handleExportSelected={handleExport}
        actions={ActionsDropdown}
      />
    </>
  );
};
