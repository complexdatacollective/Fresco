import { prisma } from '~/utils/db';
import { unstable_noStore } from 'next/cache';
import ProtocolsTableClient from './ProtocolsTableClient';

async function getData() {
  unstable_noStore();

  const data = await prisma.$transaction([
    prisma.protocol.findMany({
      include: {
        interviews: true,
      },
    }),
    prisma.appSettings.findFirst(),
  ]);

  return {
    protocols: data[0],
    appSettings: data[1],
  };
}

export type GetData = ReturnType<typeof getData>;

export default function ProtocolsTable() {
  const dataPromise = getData();

  return <ProtocolsTableClient dataPromise={dataPromise} />;
}
