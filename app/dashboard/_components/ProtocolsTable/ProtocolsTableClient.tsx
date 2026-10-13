'use client';

import { type Row } from '@tanstack/react-table';
import { Trash } from 'lucide-react';
import { use, useMemo, useState } from 'react';
import { SuperJSON } from 'superjson';

import { defineMessages } from '@codaco/app-i18n/messages';
import { useAppIntl } from '@codaco/app-i18n/react';
import { Button } from '@codaco/fresco-ui/Button';
import { DataTable } from '@codaco/fresco-ui/DataTable/DataTable';
import { DataTableFloatingBar } from '@codaco/fresco-ui/DataTable/DataTableFloatingBar';
import { DataTableToolbar } from '@codaco/fresco-ui/DataTable/DataTableToolbar';
import { type DataTableFeatures } from '@codaco/fresco-ui/DataTable/features';
import { type DataTableColumnDef } from '@codaco/fresco-ui/DataTable/types';
import { useClientDataTable } from '~/hooks/useClientDataTable';
import type { GetProtocolsQuery } from '~/queries/protocols';

import { DeleteProtocolsDialog } from '../../protocols/_components/DeleteProtocolsDialog';
import ProtocolUploader from '../ProtocolUploader';
import { ActionsDropdown } from './ActionsDropdown';
import { getProtocolColumns } from './Columns';
import { type GetData } from './ProtocolsTable';

const messages = defineMessages({
  byName: {
    id: 'fresco.ProtocolsTable.ProtocolsTableClient.byName',
    defaultMessage: 'by name',
    description:
      'Researcher-facing ProtocolsTable / ProtocolsTableClient: by name',
  },
  deleteSelected: {
    id: 'fresco.ProtocolsTable.ProtocolsTableClient.deleteSelected',
    defaultMessage: 'Delete Selected',
    description:
      'Researcher-facing ProtocolsTable / ProtocolsTableClient: Delete Selected',
  },
});

export type ProtocolWithInterviews = GetProtocolsQuery[number];

const actionsColumn: DataTableColumnDef<ProtocolWithInterviews> = {
  id: 'actions',
  cell: ({ row }: { row: Row<DataTableFeatures, ProtocolWithInterviews> }) => (
    <ActionsDropdown row={row} />
  ),
};

const ProtocolsTableClient = ({ dataPromise }: { dataPromise: GetData }) => {
  'use no memo';

  const intl = useAppIntl();

  // TanStack Table: consumers must also opt out so React Compiler doesn't memoize JSX that depends on the table ref.

  const [rawProtocols, allowAnonymousRecruitment, storageConfigured] =
    use(dataPromise);
  const protocols = useMemo(
    () => SuperJSON.parse<GetProtocolsQuery>(rawProtocols),
    [rawProtocols],
  );

  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [protocolsToDelete, setProtocolsToDelete] =
    useState<ProtocolWithInterviews[]>();

  const handleDelete = (data: ProtocolWithInterviews[]) => {
    setProtocolsToDelete(data);
    setShowAlertDialog(true);
  };

  const columns = useMemo<DataTableColumnDef<ProtocolWithInterviews>[]>(
    () => [
      ...getProtocolColumns(intl, allowAnonymousRecruitment),
      actionsColumn,
    ],
    [intl, allowAnonymousRecruitment],
  );

  const { table } = useClientDataTable({
    data: protocols,
    columns,
    defaultSortBy: { id: 'importedAt', desc: true },
  });

  return (
    <>
      <DataTable
        table={table}
        toolbar={
          <DataTableToolbar
            table={table}
            searchableColumns={[
              { id: 'name', title: intl.formatMessage(messages.byName) },
            ]}
          >
            <ProtocolUploader buttonDisabled={!storageConfigured} />
          </DataTableToolbar>
        }
        floatingBar={
          <DataTableFloatingBar table={table}>
            <Button
              onClick={() =>
                handleDelete(
                  table.getSelectedRowModel().rows.map((r) => r.original),
                )
              }
              color="destructive"
              icon={<Trash className="size-4" />}
            >
              {intl.formatMessage(messages.deleteSelected)}
            </Button>
          </DataTableFloatingBar>
        }
      />
      <DeleteProtocolsDialog
        open={showAlertDialog}
        setOpen={setShowAlertDialog}
        protocolsToDelete={protocolsToDelete ?? []}
      />
    </>
  );
};

export default ProtocolsTableClient;
