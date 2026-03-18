'use client';

import { flexRender, type Row } from '@tanstack/react-table';
import type { Interview } from '~/lib/db/generated/client';
import { FileUp, HardDriveUpload, Loader } from 'lucide-react';
import { hash as objectHash } from 'ohash';
import { use, useCallback, useMemo, useState } from 'react';
import { ActionsDropdown } from '~/app/dashboard/_components/InterviewsTable/ActionsDropdown';
import { InterviewColumns } from '~/app/dashboard/_components/InterviewsTable/Columns';
import { DeleteInterviewsDialog } from '~/app/dashboard/interviews/_components/DeleteInterviewsDialog';
import { ExportInterviewsDialog } from '~/app/dashboard/interviews/_components/ExportInterviewsDialog';
import { GenerateInterviewURLs } from '~/app/dashboard/interviews/_components/GenerateInterviewURLs';
import { ActiveFilterChips } from '~/components/DataTable/filters/ActiveFilterChips';
import { Button } from '~/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Input } from '~/components/ui/Input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { useClientDataTable } from '~/hooks/useClientDataTable';
import type { GetInterviewsReturnType } from '~/queries/interviews';
import type { GetProtocolsReturnType } from '~/queries/protocols';

type InterviewRow = Awaited<GetInterviewsReturnType>[0];

export const InterviewsTable = ({
  interviewsPromise,
  protocolsPromise,
}: {
  interviewsPromise: GetInterviewsReturnType;
  protocolsPromise: GetProtocolsReturnType;
}) => {
  const interviews = use(interviewsPromise);

  const [selectedInterviews, setSelectedInterviews] =
    useState<typeof interviews>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const columns = useMemo(() => {
    const base = InterviewColumns();

    const actionsColumn = {
      id: 'actions',
      header: () => null,
      // InterviewRow is a superset of Interview (adds participant/protocol
      // relations). TanStack's Row generic is invariant, requiring this cast.
      cell: ({ row }: { row: Row<InterviewRow> }) => (
        <ActionsDropdown row={row as unknown as Row<Interview>} />
      ),
    };

    return [...base, actionsColumn];
  }, []);

  const { table } = useClientDataTable({
    data: interviews,
    columns,
    enableUrlFilters: true,
    defaultSortBy: { id: 'lastUpdated', desc: true },
  });

  const unexportedInterviews = useMemo(
    () => interviews.filter((interview) => !interview.exportTime),
    [interviews],
  );

  const completedInterviews = useMemo(
    () => interviews.filter((interview) => interview.finishTime),
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

  const handleExportCompleted = () => {
    setSelectedInterviews(completedInterviews);
    setShowExportModal(true);
  };

  const handleResetExport = () => {
    setSelectedInterviews([]);
    setShowExportModal(false);
  };

  const deleteSelectedHandler = () => {
    setIsDeleting(true);
    const selectedData = table
      .getSelectedRowModel()
      .rows.map((r) => r.original);
    handleDelete(selectedData);
    setIsDeleting(false);
  };

  const exportHandler = useCallback(() => {
    const selectedData = table
      .getSelectedRowModel()
      .rows.map((r) => r.original);
    setSelectedInterviews(selectedData);
    setShowExportModal(true);
  }, [table]);

  const hasSelectedRows = table.getSelectedRowModel().rows.length > 0;

  return (
    <>
      <ExportInterviewsDialog
        key={objectHash(selectedInterviews)}
        open={showExportModal}
        handleCancel={handleResetExport}
        interviewsToExport={selectedInterviews!}
      />
      <DeleteInterviewsDialog
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        interviewsToDelete={selectedInterviews ?? []}
      />
      <div className="flex items-center gap-2 pt-1 pb-4">
        <Input
          name="filter"
          placeholder="Filter by identifier..."
          value={
            (table.getColumn('identifier')?.getFilterValue() as string) ?? ''
          }
          onChange={(event) =>
            table.getColumn('identifier')?.setFilterValue(event.target.value)
          }
          className="mt-0"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={interviews.length === 0}>
              <HardDriveUpload className="mr-2 inline-block h-4 w-4" />
              Export Interview Data
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleExportAll}>
              Export all interviews
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={completedInterviews.length === 0}
              onClick={handleExportCompleted}
            >
              Export all completed interviews
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
      </div>
      <ActiveFilterChips table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div>
        <div className="flex justify-between py-4">
          <div className="text-muted-foreground text-sm">
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
        {hasSelectedRows && (
          <Button
            onClick={() => void deleteSelectedHandler()}
            variant="destructive"
            size="sm"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                Deleting...
                <Loader className="h-4 w-4 animate-spin text-white" />
              </span>
            ) : (
              'Delete Selected'
            )}
          </Button>
        )}

        {hasSelectedRows && (
          <Button
            onClick={exportHandler}
            variant="default"
            size="sm"
            className="mx-2 gap-x-2.5"
          >
            Export Selected
            <FileUp className="h-5 w-5" />
          </Button>
        )}
      </div>
    </>
  );
};
