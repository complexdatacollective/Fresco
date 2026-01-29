'use client';

import { HardDriveUpload } from 'lucide-react';
import { use, useMemo, useState } from 'react';
import superjson from 'superjson';
import { ActionsDropdown } from '~/app/dashboard/_components/InterviewsTable/ActionsDropdown';
import { InterviewColumns } from '~/app/dashboard/_components/InterviewsTable/Columns';
import { DeleteInterviewsDialog } from '~/app/dashboard/interviews/_components/DeleteInterviewsDialog';
import { ExportInterviewsDialog } from '~/app/dashboard/interviews/_components/ExportInterviewsDialog';
import { GenerateInterviewURLs } from '~/app/dashboard/interviews/_components/GenerateInterviewURLs';
import { DataTable } from '~/components/DataTable/DataTable';
import { Button } from '~/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import type {
  GetInterviewsQuery,
  GetInterviewsReturnType,
} from '~/queries/interviews';
import type { GetProtocolsReturnType } from '~/queries/protocols';

export const InterviewsTable = ({
  interviewsPromise,
  protocolsPromise,
}: {
  interviewsPromise: GetInterviewsReturnType;
  protocolsPromise: GetProtocolsReturnType;
}) => {
  const serializedInterviews = use(interviewsPromise);
  const interviews = superjson.parse<GetInterviewsQuery>(serializedInterviews);

  const [selectedInterviews, setSelectedInterviews] =
    useState<typeof interviews>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const unexportedInterviews = useMemo(
    () => interviews.filter((interview) => !interview.exportTime),
    [interviews],
  );

  const handleDelete = (data: typeof interviews) => {
    setSelectedInterviews(data);
    setShowDeleteModal(true);
  };

  const handleExportUnexported = () => {
    setSelectedInterviews(unexportedInterviews);
    setShowExportModal(true);
  };

  const handleExportAll = () => {
    setSelectedInterviews(interviews);
    setShowExportModal(true);
  };

  const handleResetExport = () => {
    setSelectedInterviews([]);
    setShowExportModal(false);
  };

  return (
    <>
      <ExportInterviewsDialog
        open={showExportModal}
        handleCancel={handleResetExport}
        interviewsToExport={selectedInterviews!}
      />
      <DeleteInterviewsDialog
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        interviewsToDelete={selectedInterviews ?? []}
      />
      <DataTable
        columns={InterviewColumns()}
        data={interviews}
        filterColumnAccessorKey="identifier"
        handleDeleteSelected={handleDelete}
        handleExportSelected={(selected) => {
          setSelectedInterviews(selected);
          setShowExportModal(true);
        }}
        actions={ActionsDropdown}
        defaultSortBy={{ id: 'lastUpdated', desc: true }}
        headerItems={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button icon={<HardDriveUpload />} />}
                disabled={interviews.length === 0}
                nativeButton
                data-testid="export-interviews-button"
              >
                Export Interview Data
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportAll}>
                  Export all interviews
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={unexportedInterviews.length === 0}
                  onClick={handleExportUnexported}
                >
                  Export all unexported interviews
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <GenerateInterviewURLs
              interviews={interviews}
              protocolsPromise={protocolsPromise}
            />
          </>
        }
      />
    </>
  );
};
