import { unstable_noStore } from 'next/cache';
import { prisma } from '~/utils/db';
import ProtocolsTableClient from './ProtocolsTableClient';

async function getData() {
  unstable_noStore();

  try {
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
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return {
      protocols: null,
      appSettings: null,
    };
  }
}

export type GetData = ReturnType<typeof getData>;

export default function ProtocolsTable() {
  const dataPromise = getData();

  return <ProtocolsTableClient dataPromise={dataPromise} />;
}
