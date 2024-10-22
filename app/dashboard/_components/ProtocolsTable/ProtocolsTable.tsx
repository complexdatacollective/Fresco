import { unstable_noStore } from 'next/cache';
import { Suspense } from 'react';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import { getAppSetting } from '~/queries/appSettings';
import { getProtocols } from '~/queries/protocols';
import ProtocolsTableClient from './ProtocolsTableClient';

async function getData() {
  unstable_noStore();

  return Promise.all([
    getProtocols(),
    getAppSetting('allowAnonymousRecruitment'),
  ]);
}

export type GetData = ReturnType<typeof getData>;

export default function ProtocolsTable() {
  return (
    <Suspense
      fallback={<DataTableSkeleton columnCount={4} filterableColumnCount={1} />}
    >
      <ProtocolsTableClient dataPromise={getData()} />
    </Suspense>
  );
}
