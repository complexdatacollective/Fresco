'use client';

import {
  type ColumnDef,
  type Row,
  type RowSelectionState,
} from '@tanstack/react-table';
import { HardDriveUpload } from 'lucide-react';
import { use, useMemo, useState, useTransition } from 'react';
import { Button } from '@codaco/fresco-ui/Button';
import { cx } from '@codaco/fresco-ui/utils/cva';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@codaco/fresco-ui/DropdownMenu';
import { useToast } from '@codaco/fresco-ui/Toast';
import {
  getInterviewDeletionInfo,
  resolveInterviewIds,
} from '~/actions/interviews';
import { ActionsDropdown } from '~/app/dashboard/_components/InterviewsTable/ActionsDropdown';
import { InterviewColumns } from '~/app/dashboard/_components/InterviewsTable/Columns';
import { DeleteInterviewsDialog } from '~/app/dashboard/interviews/_components/DeleteInterviewsDialog';
import { ExportInterviewsDialog } from '~/app/dashboard/interviews/_components/ExportInterviewsDialog';
import { GenerateInterviewURLs } from '~/app/dashboard/interviews/_components/GenerateInterviewURLs';
import {
  NuqsTableProvider,
  useNuqsTable,
} from '~/components/DataTable/nuqs/NuqsTableProvider';
import type {
  GetInterviewsQuery,
  GetInterviewsReturnType,
  InterviewFilterOptions,
} from '~/queries/interviews';
import type { GetProtocolsReturnType } from '~/queries/protocols';
import InterviewsTableRows from './InterviewsTableRows';
import InterviewsToolbar from './InterviewsToolbar';
import { INTERVIEWS_PREFIX, type InterviewsSearchParams } from './searchParams';

type InterviewRow = GetInterviewsQuery[number];

type InterviewsTableProps = {
  interviewsPromise: GetInterviewsReturnType;
  filterOptionsPromise: Promise<InterviewFilterOptions>;
  protocolsPromise: GetProtocolsReturnType;
  searchParams: InterviewsSearchParams;
};

export const InterviewsTable = (props: InterviewsTableProps) => {
  return (
    <NuqsTableProvider prefix={INTERVIEWS_PREFIX}>
      <InterviewsTableInner {...props} />
    </NuqsTableProvider>
  );
};

const InterviewsTableInner = ({
  interviewsPromise,
  filterOptionsPromise,
  protocolsPromise,
  searchParams,
}: InterviewsTableProps) => {
  // TanStack Table: consumers must also opt out so React Compiler doesn't memoize JSX that depends on the table ref.
  'use no memo';
  const { isPending } = useNuqsTable();
  const { add } = useToast();
  const filterOptions = use(filterOptionsPromise);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [interviewsToDelete, setInterviewsToDelete] = useState<
    { id: string; exportTime: Date | null }[]
  >([]);
  const [selectedInterviewIds, setSelectedInterviewIds] = useState<string[]>(
    [],
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isResolving, startResolving] = useTransition();
  const [isSelecting, startSelecting] = useTransition();
  const [isDeleteResolving, startDeleteResolving] = useTransition();

  const selectedIds = Object.keys(rowSelection).filter(
    (id) => rowSelection[id],
  );

  const columns = useMemo<ColumnDef<InterviewRow, unknown>[]>(() => {
    const actionsColumn: ColumnDef<InterviewRow> = {
      id: 'actions',
      enableSorting: false,
      cell: ({ row }: { row: Row<InterviewRow> }) => (
        <ActionsDropdown row={row} />
      ),
    };
    return [...InterviewColumns(), actionsColumn];
  }, []);

  const handleDeleteSelected = () => {
    startDeleteResolving(async () => {
      const result = await getInterviewDeletionInfo(selectedIds);
      if (result.error) {
        add({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }
      setInterviewsToDelete(result.data);
      setShowDeleteModal(true);
    });
  };

  const handleExportSelected = () => {
    setSelectedInterviewIds(selectedIds);
    setShowExportModal(true);
  };

  const handleSelectAllMatching = () => {
    startSelecting(async () => {
      const result = await resolveInterviewIds(searchParams);
      if (result.error) {
        add({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }
      setRowSelection(Object.fromEntries(result.ids.map((id) => [id, true])));
    });
  };

  const handleDeselectAll = () => {
    setRowSelection({});
  };

  const resolveAndExport = (extra?: {
    onlyUnexported?: boolean;
    onlyCompleted?: boolean;
  }) => {
    startResolving(async () => {
      const result = await resolveInterviewIds(searchParams, extra);
      if (result.error) {
        add({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }
      setSelectedInterviewIds(result.ids);
      setShowExportModal(true);
    });
  };

  const handleResetExport = () => {
    setSelectedInterviewIds([]);
    setShowExportModal(false);
  };

  const exportDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button icon={<HardDriveUpload />} />}
        disabled={isResolving}
        nativeButton
        data-testid="export-interviews-button"
        className="tablet-landscape:w-auto w-full"
      >
        Export Interview Data
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          disabled={isResolving}
          onClick={() => resolveAndExport()}
        >
          Export all interviews
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isResolving}
          onClick={() => resolveAndExport({ onlyCompleted: true })}
        >
          Export all completed interviews
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isResolving}
          onClick={() => resolveAndExport({ onlyUnexported: true })}
        >
          Export all unexported interviews
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <ExportInterviewsDialog
        open={showExportModal}
        handleCancel={handleResetExport}
        interviewIds={selectedInterviewIds}
      />
      <DeleteInterviewsDialog
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        interviewsToDelete={interviewsToDelete}
      />
      <div className="flex flex-col gap-6">
        <div
          className={cx(
            'transition-opacity duration-150',
            isPending && 'pointer-events-none opacity-60',
          )}
          aria-busy={isPending}
        >
          <InterviewsTableRows
            interviewsPromise={interviewsPromise}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            columns={columns}
            isBusy={isSelecting || isDeleteResolving}
            onDeleteSelected={handleDeleteSelected}
            onExportSelected={handleExportSelected}
            onSelectAllMatching={handleSelectAllMatching}
            onDeselectAll={handleDeselectAll}
            toolbar={
              <InterviewsToolbar filterOptions={filterOptions}>
                {exportDropdown}
                <GenerateInterviewURLs
                  protocolsPromise={protocolsPromise}
                  className="tablet-landscape:w-auto w-full"
                />
              </InterviewsToolbar>
            }
          />
        </div>
      </div>
    </>
  );
};
