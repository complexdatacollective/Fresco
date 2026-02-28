'use client';

import { type ColumnDef, type Row } from '@tanstack/react-table';
import { FileUp, HardDriveUpload, Trash } from 'lucide-react';
import { use, useMemo, useState } from 'react';
import superjson from 'superjson';
import { ActionsDropdown } from '~/app/dashboard/_components/InterviewsTable/ActionsDropdown';
import { InterviewColumns } from '~/app/dashboard/_components/InterviewsTable/Columns';
import { DeleteInterviewsDialog } from '~/app/dashboard/interviews/_components/DeleteInterviewsDialog';
import { ExportInterviewsDialog } from '~/app/dashboard/interviews/_components/ExportInterviewsDialog';
import { GenerateInterviewURLs } from '~/app/dashboard/interviews/_components/GenerateInterviewURLs';
import { DataTable } from '~/components/DataTable/DataTable';
import { DataTableFloatingBar } from '~/components/DataTable/DataTableFloatingBar';
import { DataTableToolbar } from '~/components/DataTable/DataTableToolbar';
import { Button } from '~/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { useClientDataTable } from '~/hooks/useClientDataTable';
import type {
  GetInterviewsQuery,
  GetInterviewsReturnType,
} from '~/queries/interviews';
import type { GetProtocolsReturnType } from '~/queries/protocols';

type InterviewRow = GetInterviewsQuery[number];

export const InterviewsTable = ({
  interviewsPromise,
  protocolsPromise,
}: {
  interviewsPromise: GetInterviewsReturnType;
  protocolsPromise: GetProtocolsReturnType;
}) => {
  'use no memo';
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

  const actionsColumn: ColumnDef<InterviewRow> = {
    id: 'actions',
    cell: ({ row }: { row: Row<InterviewRow> }) => (
      <ActionsDropdown row={row} />
    ),
  };

  const columns = useMemo<ColumnDef<InterviewRow, unknown>[]>(
    () => [...InterviewColumns(), actionsColumn],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const { table, tableVersion } = useClientDataTable({
    data: interviews,
    columns,
    defaultSortBy: { id: 'lastUpdated', desc: true },
  });

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
        table={table}
        tableVersion={tableVersion}
        toolbar={
          <DataTableToolbar
            table={table}
            tableVersion={tableVersion}
            searchableColumns={[{ id: 'identifier', title: 'by identifier' }]}
          >
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button icon={<HardDriveUpload />} />}
                disabled={interviews.length === 0}
                nativeButton
                data-testid="export-interviews-button"
                className="tablet:w-auto w-full"
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
              className="tablet:w-auto w-full"
            />
          </DataTableToolbar>
        }
        floatingBar={
          <DataTableFloatingBar table={table} tableVersion={tableVersion}>
            <Button
              onClick={() =>
                handleDelete(
                  table.getSelectedRowModel().rows.map((r) => r.original),
                )
              }
              color="destructive"
              icon={<Trash className="size-4" />}
            >
              Delete Selected
            </Button>
            <Button
              onClick={() => {
                setSelectedInterviews(
                  table.getSelectedRowModel().rows.map((r) => r.original),
                );
                setShowExportModal(true);
              }}
              color="primary"
              icon={<FileUp className="size-4" />}
            >
              Export Selected
            </Button>
          </DataTableFloatingBar>
        }
      />
    </>
  );
};
