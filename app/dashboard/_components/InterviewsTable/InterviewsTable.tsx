'use client';

import { type Row, type RowSelectionState } from '@tanstack/react-table';
import { HardDriveUpload } from 'lucide-react';
import { use, useMemo, useState, useTransition } from 'react';

import { defineMessages } from '@codaco/app-i18n/messages';
import {
  AppErrorMessage,
  AppMessage,
  useAppIntl,
} from '@codaco/app-i18n/react';
import { Button } from '@codaco/fresco-ui/Button';
import { type DataTableFeatures } from '@codaco/fresco-ui/DataTable/features';
import { type DataTableColumnDef } from '@codaco/fresco-ui/DataTable/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@codaco/fresco-ui/DropdownMenu';
import { useToast } from '@codaco/fresco-ui/Toast';
import { cx } from '@codaco/fresco-ui/utils/cva';
import {
  getInterviewDeletionInfo,
  resolveInterviewIds,
} from '~/actions/interviews';
import { ActionsDropdown } from '~/app/dashboard/_components/InterviewsTable/ActionsDropdown';
import { InterviewColumns } from '~/app/dashboard/_components/InterviewsTable/Columns';
import { DeleteInterviewsDialog } from '~/app/dashboard/interviews/_components/DeleteInterviewsDialog';
import { ExportInterviewsDialog } from '~/app/dashboard/interviews/_components/ExportInterviewsDialog';
import { GenerateInterviewURLs } from '~/app/dashboard/interviews/_components/GenerateInterviewURLs';
import NuqsClearFilters from '~/components/DataTable/nuqs/NuqsClearFilters';
import NuqsSearchFilter from '~/components/DataTable/nuqs/NuqsSearchFilter';
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
import { INTERVIEWS_PREFIX, type InterviewsSearchParams } from './searchParams';

const messages = defineMessages({
  error: {
    id: 'fresco.InterviewsTable.InterviewsTable.error',
    defaultMessage: 'Error',
    description: 'Researcher-facing InterviewsTable / InterviewsTable: Error',
  },
  exportInterviewData: {
    id: 'fresco.InterviewsTable.InterviewsTable.exportInterviewData',
    defaultMessage: 'Export Interview Data',
    description:
      'Researcher-facing InterviewsTable / InterviewsTable: Export Interview Data',
  },
  exportAllInterviews: {
    id: 'fresco.InterviewsTable.InterviewsTable.exportAllInterviews',
    defaultMessage: 'Export all interviews',
    description:
      'Researcher-facing InterviewsTable / InterviewsTable: Export all interviews',
  },
  exportAllCompletedInterviews: {
    id: 'fresco.InterviewsTable.InterviewsTable.exportAllCompletedInterviews',
    defaultMessage: 'Export all completed interviews',
    description:
      'Researcher-facing InterviewsTable / InterviewsTable: Export all completed interviews',
  },
  exportAllUnexportedInterviews: {
    id: 'fresco.InterviewsTable.InterviewsTable.exportAllUnexportedInterviews',
    defaultMessage: 'Export all unexported interviews',
    description:
      'Researcher-facing InterviewsTable / InterviewsTable: Export all unexported interviews',
  },
  filterByIdentifier: {
    id: 'fresco.InterviewsTable.InterviewsTable.filterByIdentifier',
    defaultMessage: 'Filter by identifier...',
    description:
      'Researcher-facing InterviewsTable / InterviewsTable: Filter by identifier...',
  },
});

const clearableFilters = [
  'q',
  'protocol',
  'started',
  'updated',
  'progress',
  'exported',
  'network',
] as const;

type InterviewRow = GetInterviewsQuery[number];

const actionsColumn: DataTableColumnDef<InterviewRow> = {
  id: 'actions',
  enableSorting: false,
  cell: ({ row }: { row: Row<DataTableFeatures, InterviewRow> }) => (
    <ActionsDropdown row={row} />
  ),
};

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
  'use no memo';

  const intl = useAppIntl();

  // TanStack Table: consumers must also opt out so React Compiler doesn't memoize JSX that depends on the table ref.

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

  const columns = useMemo<DataTableColumnDef<InterviewRow>[]>(
    () => [...InterviewColumns(intl, filterOptions), actionsColumn],
    [intl, filterOptions],
  );

  const handleDeleteSelected = () => {
    startDeleteResolving(async () => {
      const result = await getInterviewDeletionInfo(selectedIds);
      if (result.error) {
        add({
          title: <AppMessage message={messages.error} />,
          description: <AppErrorMessage error={result.error} />,
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
          title: <AppMessage message={messages.error} />,
          description: <AppErrorMessage error={result.error} />,
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
          title: <AppMessage message={messages.error} />,
          description: <AppErrorMessage error={result.error} />,
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
        {intl.formatMessage(messages.exportInterviewData)}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          disabled={isResolving}
          onClick={() => resolveAndExport()}
        >
          {intl.formatMessage(messages.exportAllInterviews)}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isResolving}
          onClick={() => resolveAndExport({ onlyCompleted: true })}
        >
          {intl.formatMessage(messages.exportAllCompletedInterviews)}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isResolving}
          onClick={() => resolveAndExport({ onlyUnexported: true })}
        >
          {intl.formatMessage(messages.exportAllUnexportedInterviews)}
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
              <div className="tablet-landscape:flex-row tablet-landscape:flex-wrap flex w-full flex-col items-center gap-2">
                <NuqsSearchFilter
                  paramKey="q"
                  placeholder={intl.formatMessage(messages.filterByIdentifier)}
                />
                {exportDropdown}
                <GenerateInterviewURLs
                  protocolsPromise={protocolsPromise}
                  className="tablet-landscape:w-auto h-auto min-h-12 w-full py-2 text-center text-wrap"
                />
                <NuqsClearFilters paramKeys={clearableFilters} />
              </div>
            }
          />
        </div>
      </div>
    </>
  );
};
