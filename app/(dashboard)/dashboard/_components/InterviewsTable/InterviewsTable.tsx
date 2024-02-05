'use client';

import { type Interview } from '@prisma/client';
import { useEffect, useState } from 'react';
import { ActionsDropdown } from '~/app/(dashboard)/dashboard/_components/InterviewsTable/ActionsDropdown';
import { InterviewColumns } from '~/app/(dashboard)/dashboard/_components/InterviewsTable/Columns';
import { DataTable } from '~/components/DataTable/DataTable';
import { Button } from '~/components/ui/Button';
import { api } from '~/trpc/client';
import { DeleteInterviewsDialog } from '../../interviews/_components/DeleteInterviewsDialog';
import { ExportInterviewsDialog } from '../../interviews/_components/ExportInterviewsDialog';
import type { RouterOutputs } from '~/trpc/shared';

type Interviews = RouterOutputs['interview']['get']['all'][0];

export const InterviewsTable = ({
  initialInterviews,
}: {
  initialInterviews: Interviews;
}) => {
  const interviews = api.interview.get.all.useQuery(undefined, {
    initialData: initialInterviews,
    refetchOnMount: false,
    onError(error) {
      throw new Error(error.message);
    },
  });

  const [selectedInterviews, setSelectedInterviews] = useState<Interview[]>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [unexportedInterviews, setUnexportedInterviews] = useState<Interview[]>(
    [],
  );

  useEffect(() => {
    if (interviews.data) {
      setUnexportedInterviews(interviews.data.filter((i) => !i.exportTime));
    }
  }, [interviews.data]);

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
      <div className="flex gap-2">
        <Button onClick={() => handleExport(interviews.data)}>
          Export all interviews
        </Button>
        <Button
          variant={'outline'}
          disabled={unexportedInterviews.length === 0}
          onClick={() => handleExport(unexportedInterviews)}
        >
          Export all unexported interviews
        </Button>
      </div>
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
