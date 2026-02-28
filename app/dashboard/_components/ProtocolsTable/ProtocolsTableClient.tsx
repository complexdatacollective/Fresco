'use client';

import { type ColumnDef, type Row } from '@tanstack/react-table';
import { Trash } from 'lucide-react';
import { use, useMemo, useState } from 'react';
import { SuperJSON } from 'superjson';
import { DataTable } from '~/components/DataTable/DataTable';
import { DataTableFloatingBar } from '~/components/DataTable/DataTableFloatingBar';
import { DataTableToolbar } from '~/components/DataTable/DataTableToolbar';
import { Button } from '~/components/ui/Button';
import { useClientDataTable } from '~/hooks/useClientDataTable';
import type { GetProtocolsQuery } from '~/queries/protocols';
import { DeleteProtocolsDialog } from '../../protocols/_components/DeleteProtocolsDialog';
import ProtocolUploader from '../ProtocolUploader';
import { ActionsDropdown } from './ActionsDropdown';
import { getProtocolColumns } from './Columns';
import { type GetData } from './ProtocolsTable';

export type ProtocolWithInterviews = GetProtocolsQuery[number];

const ProtocolsTableClient = ({ dataPromise }: { dataPromise: GetData }) => {
  // TanStack Table: consumers must also opt out so React Compiler doesn't memoize JSX that depends on the table ref.
  'use no memo';
  const [rawProtocols, allowAnonymousRecruitment, hasUploadThingToken] =
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

  const actionsColumn: ColumnDef<ProtocolWithInterviews> = {
    id: 'actions',
    cell: ({ row }: { row: Row<ProtocolWithInterviews> }) => (
      <ActionsDropdown row={row} />
    ),
  };

  const columns = useMemo<ColumnDef<ProtocolWithInterviews, unknown>[]>(
    () => [...getProtocolColumns(allowAnonymousRecruitment), actionsColumn],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allowAnonymousRecruitment],
  );

  const { table } = useClientDataTable({
    data: protocols,
    columns,
  });

  return (
    <>
      <DataTable
        table={table}
        toolbar={
          <DataTableToolbar
            table={table}
            searchableColumns={[{ id: 'name', title: 'by name' }]}
          >
            <ProtocolUploader buttonDisabled={!hasUploadThingToken} />
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
              Delete Selected
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
