import { Suspense } from 'react';
import { DataTableSkeleton } from '@codaco/fresco-ui/DataTable/DataTableSkeleton';
import { getAppSetting } from '~/queries/appSettings';
import { getProtocols } from '~/queries/protocols';
import ProtocolsTableClient from './ProtocolsTableClient';

async function getData() {
  const [
    protocols,
    allowAnonymousRecruitment,
    storageProvider,
    uploadThingToken,
  ] = await Promise.all([
    getProtocols(),
    getAppSetting('allowAnonymousRecruitment'),
    getAppSetting('storageProvider'),
    getAppSetting('uploadThingToken'),
  ]);
  const storageConfigured = storageProvider === 's3' || !!uploadThingToken;
  return [protocols, allowAnonymousRecruitment, storageConfigured] as const;
}

export type GetData = ReturnType<typeof getData>;

export default function ProtocolsTable() {
  return (
    <Suspense
      fallback={
        <DataTableSkeleton
          columnCount={4}
          searchableColumnCount={1}
          headerItemsCount={1}
        />
      }
    >
      <ProtocolsTableClient dataPromise={getData()} />
    </Suspense>
  );
}
