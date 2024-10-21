import { unstable_noStore } from 'next/cache';
import { Suspense } from 'react';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import { getAppSetting } from '~/queries/appSettings';
import { prisma } from '~/utils/db';
import ProtocolsTableClient from './ProtocolsTableClient';

async function getData() {
  unstable_noStore();

  const data = await prisma.$transaction([
    prisma.protocol.findMany({
      include: {
        interviews: true,
      },
    }),
  ]);

  const allowAnonymousRecruitment = await getAppSetting(
    'allowAnonymousRecruitment',
  );

  return {
    protocols: data[0],
    allowAnonymousRecruitment: allowAnonymousRecruitment ?? false,
  };
}

export type GetData = ReturnType<typeof getData>;

export default function ProtocolsTable() {
  const dataPromise = getData();

  return (
    <Suspense
      fallback={<DataTableSkeleton columnCount={4} filterableColumnCount={1} />}
    >
      <ProtocolsTableClient dataPromise={dataPromise} />
    </Suspense>
  );
}
